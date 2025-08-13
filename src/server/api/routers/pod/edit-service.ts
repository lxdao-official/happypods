import { NotificationService } from "../notification/notification-service";
import { NotificationType, PodStatus, MilestoneStatus } from "@prisma/client";
import { getBalance } from "../wallet/queries";
import type { PrismaClient } from "@prisma/client";

interface EditPodInput {
  id: number;
  avatar?: string;
  title: string;
  description: string;
  links?: any;
  tags?: string;
  milestones: Array<{
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
    
    // 3. 创建新版本Pod（简单复制+修改）
    const newPod = await this.createNewPodVersion(ctx, originalPod, podData);
    
    // 4. 创建milestone
    await this.createMilestones(ctx, newPod.id, milestones, originalPod.milestones);
    
    // 5. 发送通知
    await this.sendEditNotification(ctx, newPod, originalPod);
    
    return newPod;
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
      throw new Error("Pod不存在");
    }

    if (pod.applicantId !== ctx.user.id) {
      throw new Error("没有权限编辑此Pod");
    }

    if (pod.status !== PodStatus.IN_PROGRESS) {
      throw new Error("只能编辑状态为进行中的Pod");
    }

    // 检查同组下是否已有待审核的Pod
    const existingReviewingPod = await ctx.db.pod.findFirst({
      where: {
        podGroupId: pod.podGroupId,
        status: PodStatus.REVIEWING,
        inactiveTime: null,
      }
    });

    if (existingReviewingPod) {
      throw new Error("该Pod组下已有正在审核中的版本，请等待审核完成后再编辑");
    }

    return pod;
  }

  private static async validateEditConstraints(
    ctx: EditPodContext, 
    originalPod: any, 
    newMilestones: any[]
  ) {
    // 校验milestone数量
    const completedMilestones = originalPod.milestones.filter(
      (m: any) => m.status === MilestoneStatus.COMPLETED
    );
    
    if (newMilestones.length + completedMilestones.length > 3) {
      throw new Error("Milestone总数不能超过3个（不包含已完成的）");
    }

    // 校验余额
    const totalAmount = newMilestones.reduce((sum, m) => sum + Number(m.amount), 0);
    const { rawBalance } = await getBalance({
      address: originalPod.grantsPool.treasuryWallet,
      chainType: originalPod.grantsPool.chainType,
      tokenType: originalPod.currency,
    });
    
    if (totalAmount > Number(rawBalance)) {
      throw new Error(`可用余额不足！需要 ${totalAmount}，可用 ${rawBalance}`);
    }
  }

  private static async createNewPodVersion(
    ctx: EditPodContext, 
    originalPod: any, 
    podData: Omit<EditPodInput, 'id' | 'milestones'>
  ) {
    return await ctx.db.pod.create({
      data: {
        podGroupId: originalPod.podGroupId,
        grantsPoolId: originalPod.grantsPoolId,
        rfpId: originalPod.rfpId,
        walletAddress: originalPod.walletAddress,
        currency: originalPod.currency,
        applicantId: originalPod.applicantId,
        avatar: podData.avatar ?? originalPod.avatar,
        title: podData.title,
        description: podData.description,
        links: podData.links ?? originalPod.links,
        tags: podData.tags ?? originalPod.tags,
        status: PodStatus.REVIEWING,
      },
      include: {
        applicant: true,
        grantsPool: true,
      },
    });
  }

  private static async createMilestones(
    ctx: EditPodContext, 
    newPodId: number, 
    newMilestones: any[], 
    originalMilestones: any[]
  ) {
    // 创建新的milestone
    const newMilestonePromises = newMilestones.map(milestone => 
      ctx.db.milestone.create({
        data: {
          podId: newPodId,
          title: milestone.title,
          description: milestone.description,
          amount: milestone.amount,
          deadline: new Date(milestone.deadline),
          status: MilestoneStatus.ACTIVE,
        },
      })
    );

    // 复制已完成的milestone
    const completedMilestones = originalMilestones.filter(
      (m: any) => m.status === MilestoneStatus.COMPLETED
    );
    
    const completedMilestonePromises = completedMilestones.map((milestone: any) =>
      ctx.db.milestone.create({
        data: {
          podId: newPodId,
          title: milestone.title,
          description: milestone.description,
          amount: milestone.amount,
          deadline: milestone.deadline,
          status: MilestoneStatus.COMPLETED,
          deliveryInfo: milestone.deliveryInfo,
          safeTransactionHash: milestone.safeTransactionHash,
          currentPhase: milestone.currentPhase,
        },
      })
    );

    await Promise.all([...newMilestonePromises, ...completedMilestonePromises]);
  }

  private static async sendEditNotification(
    ctx: EditPodContext, 
    newPod: any, 
    originalPod: any
  ) {
    await NotificationService.createNotification({
      type: NotificationType.POD_REVIEW,
      senderId: newPod.applicantId,
      receiverId: newPod.grantsPool.ownerId,
      title: `Pod编辑审核通知`,
      content: `${newPod.applicant.name} 编辑了Pod "${newPod.title}"，请及时审核新版本!`,
      params: {
        podId: newPod.id,
        originalPodId: originalPod.id,
      }
    });
  }
}
