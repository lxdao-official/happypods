import { NotificationService } from "../notification/notification-service";
import { NotificationType, PodStatus, MilestoneStatus } from "@prisma/client";
import { getBalance } from "../wallet/queries";
import type { Prisma, PrismaClient } from "@prisma/client";
import { formatDate } from "~/lib/utils";
import { handlePodTermited } from "./mutations";

interface EditPodInput {
  id: number;
  avatar?: string;
  title: string;
  description: string;
  links?: any;
  tags?: string;
  milestones: Array<{
    id?: number | null; // 数据库ID，新建时为null
    title: string;
    description: string;
    amount: number;
    deadline: string;
  }>;
}

interface EditPodContext {
  db: PrismaClient;
  user: { id: number };
}

export class PodEditService {
  static async editPod(ctx: EditPodContext, input: EditPodInput) {
    const { id, milestones, ...podData } = input;

    // 1. 基础验证
    const originalPod = await this.validateEditPermissions(ctx, id);
    
    // 2. 业务验证
    await this.validateEditConstraints(ctx, originalPod, milestones);
    
    // 3. 创建新版本数据并保存到 versions 字段
    const updatedPod = await this.saveVersionToDatabase(ctx, originalPod, { ...podData, milestones });
    
    // 4. 发送通知
    await this.sendEditNotification(ctx, updatedPod, originalPod);
    
    return updatedPod;
  }

  private static async validateEditPermissions(ctx: EditPodContext, podId: number) {
    const pod = await ctx.db.pod.findUnique({
      where: { id: podId },
      include: {
        grantsPool: true,
        milestones: true
      },
    });

    if (!pod) {
      throw new Error("pod not found");
    }

    if (pod.applicantId !== ctx.user.id) {
      throw new Error("no permission to edit this pod");
    }

    if (pod.status !== PodStatus.IN_PROGRESS) {
      throw new Error("only in progress pod can be edited");
    }

    // 检查是否已有待审核的版本
    const hasReviewingVersion = pod.versions.some((version: any) => 
      version.status === 'REVIEWING'
    );
    
    if (hasReviewingVersion) {
      throw new Error("this pod has a version being reviewed, please wait for the review to complete before editing");
    }

    return pod;
  }

  private static async validateEditConstraints(
    ctx: EditPodContext, 
    originalPod: any, 
    newMilestones: any[]
  ) {
    // 校验milestone数量
    if (newMilestones.length > 3) {
      throw new Error("the number of milestones cannot exceed 3 (excluding completed)");
    }

    // 校验余额
    const totalAmount = newMilestones.reduce((sum, m) => sum + Number(m.amount), 0);
    const { rawBalance } = await getBalance({
      address: originalPod.grantsPool.treasuryWallet,
      chainType: originalPod.grantsPool.chainType,
      tokenType: originalPod.currency,
    });
    
    if (totalAmount > Number(rawBalance)) {
      throw new Error(`grants pool insufficient balance`);
    }
  }

  private static async saveVersionToDatabase(
    ctx: EditPodContext,
    originalPod: any,
    editData: any
  ) {
    // 构造版本数据，保持与数据库查询结果一致的结构
    const versionData = {
      id: `version_${Date.now()}`, // 临时ID，用于前端显示
      avatar: editData.avatar ?? originalPod.avatar,
      title: editData.title,
      description: editData.description,
      links: editData.links ?? originalPod.links,
      tags: editData.tags ?? originalPod.tags,
      status: 'REVIEWING', // 新版本状态为审核中
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      // 直接存储传入的 milestones 数据
      milestones: editData.milestones.map((milestone: any) => ({
        id: milestone.id, // 保存传入的数据库ID，新建时为null
        title: milestone.title,
        description: milestone.description,
        amount: milestone.amount,
        deadline: milestone.deadline,
        status: 'ACTIVE',
        deliveryInfo: [],
        metadata: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })),
    };

    // 更新 Pod 的 versions 字段
    const updatedPod = await ctx.db.pod.update({
      where: { id: originalPod.id },
      data: {
        versions: {
          push: versionData
        }
      },
      include: {
        applicant: true,
        grantsPool: true,
        milestones: true,
      },
    });

    return updatedPod;
  }

  private static async sendEditNotification(
    ctx: EditPodContext, 
    updatedPod: any, 
    originalPod: any
  ) {
    await NotificationService.createNotification({
      type: NotificationType.POD_REVIEW,
      senderId: updatedPod.applicantId,
      receiverId: updatedPod.grantsPool.ownerId,
      title: `Pod Edit Review`,
      content: `${updatedPod.applicant.name} edited Pod "${updatedPod.title}"`,
      params: {
        podId: updatedPod.id,
        action: 'edit_review'
      }
    });
  }

  // 审核版本（通过或拒绝）
  static async reviewVersion(ctx: EditPodContext, podId: number, versionData: any, isApproved: boolean) {
    // 1. 权限验证
    const existingPod = await this.validateReviewPermissions(ctx, podId);
    
    // 2. 清空 versions 字段
    await ctx.db.pod.update({
      where: { id: podId, status: PodStatus.IN_PROGRESS },
      data: { versions: [] }
    });
    
    // 3. 如果是通过，则更新Pod和milestones
    if (isApproved) {
      // 更新Pod基本信息
      await ctx.db.pod.update({
        where: { id: podId },
        data: {
          title: versionData.title,
          description: versionData.description,
          avatar: versionData.avatar,
          tags: versionData.tags,
          links: versionData.links,
        },
      });


      // 筛选需要失效的 milestone，将删除的 active 失效
      const milestonesIds = versionData.milestones.map((v:any)=>v.id);
      const needInactiveMilestones = existingPod.milestones
      .filter(v=>v.status === MilestoneStatus.ACTIVE)
      .filter(v=>!milestonesIds.includes(v.id));

      await Promise.all(needInactiveMilestones.map(v=>ctx.db.milestone.update({
        where: { id: v.id },
        data: { status: MilestoneStatus.INACTIVE, inactiveAt: new Date() }
      })));

      // 处理每个 milestone，判断操作是否是新增还是更新
      const milestonePromises = versionData.milestones.map((milestone: any) => {
        console.log('milestone==>',milestone);
        const item = {
          podId: podId,
          title: milestone.title,
          description: milestone.description,
          amount: milestone.amount,
          deadline: new Date(milestone.deadline),
          status: MilestoneStatus.ACTIVE
        }
        console.log('item==>',item);
        if(!milestone.id){ // 如果id 不存在则新增
            return ctx.db.milestone.create({
              data: item
            });
        }else{// 如果 ID 存在，则更新现有 milestone
          return ctx.db.milestone.update({
            where: { id: Number(milestone.id) },
            data: item,
          });
        }
        });
        await Promise.all(milestonePromises);
      }


      // 4. 发送通知
      await this.sendReviewNotification(ctx, existingPod, versionData, isApproved);

      // 如果已经不存在 active 的 milestone 则项目被终止失败
      if(existingPod.milestones.every(v=>v.status !== MilestoneStatus.ACTIVE)){
        await handlePodTermited(
          ctx.db, 
          existingPod.id, 
          ctx
        );
      }
      
      return isApproved ? { success: true } : { success: true };
  }

  private static async validateReviewPermissions(ctx: EditPodContext, podId: number) {
    const pod = await ctx.db.pod.findUnique({
      where: { id: podId },
      include: { grantsPool: true, milestones:true },
    });

    if (!pod) {
      throw new Error("pod not found");
    }

    if (pod.grantsPool.ownerId !== ctx.user.id) {
      throw new Error("no permission to review this pod version");
    }

    return pod;
  }

  private static async sendReviewNotification(ctx: EditPodContext, existingPod: any, versionData: any, isApproved: boolean) {
    const title = isApproved ? "Pod version approved" : "Pod version rejected";
    const content = isApproved 
      ? `Your Pod "${versionData.title}" version has been approved`
      : `Your ${formatDate(versionData.createdAt)} submitted Pod "${versionData.title}" version has been rejected`;
    const action = isApproved ? 'version_approved' : 'version_rejected';

    await NotificationService.createNotification({
      type: NotificationType.POD_REVIEW,
      senderId: ctx.user.id,
      receiverId: existingPod.applicantId,
      title,
      content,
      params: {
        podId: existingPod.id,
        action
      }
    });
  }
}
