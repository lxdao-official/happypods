import { protectedProcedure } from "~/server/api/trpc";
import { submitMilestoneDeliverySchema, reviewMilestoneDeliverySchema, confirmPaymentSchema, initiatePodRefundSchema } from "./schemas";
import { NotificationService } from "../notification/notification-service";
import { MilestoneStatus, NotificationType, PodStatus } from "@prisma/client";
import { optimism } from "viem/chains";
import { PLATFORM_CHAINS } from "~/lib/config";

// 通用的退款逻辑函数
const handlePodRefund = async (
  db: any,
  podId: number,
  refundSafeTransactionHash: string,
  reason: string
) => {
  // 更新Pod状态为TERMINATED，并记录退款交易hash
  const updatedPod = await db.pod.update({
    where: { id: podId },
    data: { 
      status: PodStatus.TERMINATED,
      refundSafeTransactionHash: refundSafeTransactionHash 
    },
    include: {
      applicant: true,
      grantsPool: {
        select: { ownerId: true }
      },
      milestones: {
        where: { status: MilestoneStatus.ACTIVE }
      }
    }
  });

  // 将所有ACTIVE状态的milestone设置为REJECTED
  if (updatedPod.milestones.length > 0) {
    await db.milestone.updateMany({
      where: { 
        podId: podId,
        status: MilestoneStatus.ACTIVE
      },
      data: { status: MilestoneStatus.REJECTED }
    });
  }

  return updatedPod;
};

export const milestoneMutations = {
  // 提交milestone交付
  submitMilestoneDelivery: protectedProcedure
    .input(submitMilestoneDeliverySchema)
    .mutation(async ({ ctx, input }) => {
      // 检查milestone是否存在
      const milestone = await ctx.db.milestone.findUnique({
        where: { id: input.milestoneId },
        include: { pod: true },
      });

      if (!milestone) {
        throw new Error("Milestone不存在");
      }

      // 检查当前用户是否是Pod的申请者
      if (milestone.pod.applicantId !== ctx.user!.id) {
        throw new Error("没有权限提交此Milestone");
      }

      // 检查milestone状态是否为ACTIVE
      if (milestone.status !== "ACTIVE") {
        throw new Error("只能提交状态为ACTIVE的Milestone");
      }

      // 获取当前的deliveryInfo数组
      const currentDeliveryInfo = (milestone.deliveryInfo as any[]) || [];
      
      // 检查提交次数是否超过3次
      if (currentDeliveryInfo.length >= 3) {
        throw new Error("已达到最大提交次数限制（3次）");
      }

      // 根据milestonesID查询gp创建者id与pod名称
      const gpOwnerId = await ctx.db.grantsPool.findUnique({
        where: { id: milestone.pod.grantsPoolId },
        select: { ownerId: true },
      });

      if(!gpOwnerId){
        throw new Error("Grants Pool不存在");
      }

      // !todo 校验提交之前需要检查国库余额是否充足

       //!todo 验证提交的transactionHash是否有效
       const safeTransaction = await PLATFORM_CHAINS[optimism.id]?.safeApiKit.getTransaction(input.transactionHash);
       console.log('safeTransaction', safeTransaction);
       if(!safeTransaction){
         throw new Error("TransactionHash无效");
       }

      // 创建新的交付信息
      const newDelivery = {
        content: input.content,
        links: input.links || {},
        submittedAt: new Date().toISOString(),
        approved: null, // 待审核
        reviewComment: null,
        reviewedAt: null,
      };

      // 更新milestone的deliveryInfo和状态
      const updatedMilestone = await ctx.db.milestone.update({
        where: { id: input.milestoneId },
        data: {
          deliveryInfo: [...currentDeliveryInfo, newDelivery],
          status: MilestoneStatus.REVIEWING,
          safeTransactionHash: milestone.safeTransactionHash ? undefined : input.transactionHash,
        },
        include: {
          pod: {
            include: {
              applicant: true,
              grantsPool: true,
            },
          },
        },
      })

      // 通知gp创建者
      await NotificationService.createNotification({
        type: NotificationType.MILESTONE_DELIVERY_SUBMIT,
        senderId: ctx.user.id,
        receiverId: gpOwnerId.ownerId,
        title: `Pod milestone 交付提交`,
        content: `${milestone.pod.title} milestone 交付已提交，请及时审核!`
      });

      return updatedMilestone;
    }),

  // 审核milestone交付
  reviewMilestoneDelivery: protectedProcedure
    .input(reviewMilestoneDeliverySchema)
    .mutation(async ({ ctx, input }) => {
      // 检查milestone是否存在
      const milestone = await ctx.db.milestone.findUnique({
        where: { id: input.milestoneId },
        include: { 
          pod: { 
            include: { grantsPool: true } 
          } 
        },
      });

      if (!milestone) {
        throw new Error("Milestone不存在");
      }

      // 检查当前用户是否是 Grants Pool 的拥有者
      if (milestone.pod.grantsPool.ownerId !== ctx.user!.id) {
        throw new Error("没有权限审核此Milestone");
      }

      // 检查milestone状态是否为REVIEWING
      if (milestone.status !== "REVIEWING") {
        throw new Error("只能审核状态为REVIEWING的Milestone");
      }

      // 获取当前的deliveryInfo数组
      const currentDeliveryInfo = (milestone.deliveryInfo as any[]) || [];
      
      // 更新指定的交付信息
      const updatedDeliveryInfo = [...currentDeliveryInfo];
      updatedDeliveryInfo[currentDeliveryInfo.length - 1] = {
        ...updatedDeliveryInfo[currentDeliveryInfo.length - 1],
        approved: input.approved,
        reviewComment: input.comment,
        reviewedAt: new Date().toISOString(),
      };

      // 确定新的milestone状态
      let newStatus;
      if (input.approved) {
        // 审核通过，milestone完成
        newStatus = MilestoneStatus.COMPLETED;

         //!todo 检查是safeTransaction
        if(!milestone.safeTransactionHash) throw new Error("safeTransactionHash不存在");
        const safeTransaction = await PLATFORM_CHAINS[optimism.id]?.safeApiKit.getTransaction(milestone.safeTransactionHash);
        if(!safeTransaction){
          throw new Error("TransactionHash无效");
        }
        
      } 
      else if (currentDeliveryInfo.length >= 3) {
          //! 已经3次提交都被拒绝，milestone失败，需要存入退款
          // 第三次拒绝时必须提供退款交易hash
          if (!input.refundSafeTransactionHash) {
            throw new Error("第三次拒绝时必须提供退款交易hash");
          }
          
          newStatus = MilestoneStatus.REJECTED;
          
          // 使用通用退款函数
          await handlePodRefund(
            ctx.db, 
            milestone.podId, 
            input.refundSafeTransactionHash, 
            "Milestone交付三次被拒绝"
          );
        }
      else {
        // 还可以重新提交
        newStatus = MilestoneStatus.ACTIVE;
      }

     

      // 更新milestone
      const updatedMilestone = await ctx.db.milestone.update({
        where: { id: input.milestoneId },
        data: {
          deliveryInfo: updatedDeliveryInfo,
          status: newStatus,
        }
      });

      // 给用户发送通知
      await NotificationService.createNotification({
        type: NotificationType.POD_REVIEW,
        senderId: ctx.user.id,
        receiverId: milestone.pod.applicantId,
        title: `GP${input.approved ? '通过' : '拒绝'} 审核结果`,
        content: `您的 Pod milestone 交付已${input.approved ? '通过' : '拒绝'} ，备注：${input.comment}`,
      });

      return updatedMilestone;
    }),

  // 确认转账
  confirmPayment: protectedProcedure
    .input(confirmPaymentSchema)
    .mutation(async ({ ctx, input }) => {
      // 检查milestone是否存在
      const milestone = await ctx.db.milestone.findUnique({
        where: { id: input.milestoneId },
        include: { 
          pod: { 
            include: { grantsPool: true } 
          } 
        },
      });

      if (!milestone) {
        throw new Error("Milestone不存在");
      }

      // 检查当前用户是否是 Grants Pool 的拥有者
      if (milestone.pod.grantsPool.ownerId !== ctx.user!.id) {
        throw new Error("没有权限确认支付此Milestone");
      }

      // 检查milestone状态是否为PENDING_PAYMENT
      if (milestone.status !== MilestoneStatus.PENDING_PAYMENT) {
        throw new Error("只能确认支付状态为PENDING_PAYMENT的Milestone");
      }

      // 更新milestone状态为COMPLETED
      const updatedMilestone = await ctx.db.milestone.update({
        where: { id: input.milestoneId },
        data: {
          status: MilestoneStatus.COMPLETED,
        },
        include: {
          pod: {
            include: {
              applicant: true,
              grantsPool: true,
            },
          },
        },
      });

      // 给用户发送通知
      await NotificationService.createNotification({
        type: NotificationType.POD_REVIEW,
        senderId: ctx.user.id,
        receiverId: milestone.pod.applicantId,
        title: `Milestone 支付完成`,
        content: `您的 Milestone "${milestone.title}" 支付已完成！`,
      });

      return updatedMilestone;
    }),

  // GP直接发起退款（用于milestone超时等情况）
  initiatePodRefund: protectedProcedure
    .input(initiatePodRefundSchema)
    .mutation(async ({ ctx, input }) => {
      // 检查Pod是否存在
      const pod = await ctx.db.pod.findUnique({
        where: { id: input.podId },
        include: { 
          grantsPool: true,
          milestones: {
            where: { status: MilestoneStatus.ACTIVE },
            orderBy: { deadline: "asc" }
          },
          applicant: true
        },
      });

      if (!pod) {
        throw new Error("Pod不存在");
      }

      // 检查当前用户是否是 Grants Pool 的拥有者
      if (pod.grantsPool.ownerId !== ctx.user!.id) {
        throw new Error("没有权限发起此Pod的退款");
      }

      // 检查Pod状态是否允许退款
      if (pod.status === PodStatus.TERMINATED) {
        throw new Error("Pod已经终止，不能重复退款");
      }

      // 检查是否存在超时未交付的milestone
      const now = new Date();
      const hasTimeoutMilestone = pod.milestones.some(milestone => {
        const deadline = new Date(milestone.deadline);
        return deadline < now && milestone.status === MilestoneStatus.ACTIVE;
      });

      if (!hasTimeoutMilestone) {
        throw new Error("没有超时未交付的Milestone，无法发起退款");
      }

      // 验证退款交易hash是否有效
      const safeTransaction = await PLATFORM_CHAINS[optimism.id]?.safeApiKit.getTransaction(input.refundSafeTransactionHash);
      if (!safeTransaction) {
        throw new Error("退款TransactionHash无效");
      }

      // 使用通用退款函数
      const updatedPod = await handlePodRefund(
        ctx.db, 
        input.podId, 
        input.refundSafeTransactionHash, 
        "GP发起Milestone超时退款"
      );

      // 通知Pod申请者
      await NotificationService.createNotification({
        type: NotificationType.POD_REVIEW,
        senderId: ctx.user.id,
        receiverId: updatedPod.applicant.id,
        title: `Pod 已被终止`,
        content: `由于Milestone交付超时，您的Pod已被GP终止并发起退款`,
      });

      return updatedPod;
    }),
};