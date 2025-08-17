import { protectedProcedure } from "~/server/api/trpc";
import { submitMilestoneDeliverySchema, reviewMilestoneDeliverySchema, initiatePodRefundSchema } from "./schemas";
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
      data: { status: MilestoneStatus.TERMINATED }
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
        throw new Error("Milestone does not exist");
      }

      // 检查当前用户是否是Pod的申请者
      if (milestone.pod.applicantId !== ctx.user!.id) {
        throw new Error("You do not have permission to submit this Milestone");
      }

      // 检查milestone状态是否为ACTIVE
      if (milestone.status !== "ACTIVE") {
        throw new Error("Only Milestones with status ACTIVE can be submitted");
      }

      // 获取当前的deliveryInfo数组
      const currentDeliveryInfo = (milestone.deliveryInfo as any[]) || [];
      
      // 检查提交次数是否超过3次
      if (currentDeliveryInfo.length >= 3) {
        throw new Error("The maximum number of submissions (3) has been reached");
      }

      // 根据milestonesID查询gp创建者id与pod名称
      const gpOwnerId = await ctx.db.grantsPool.findUnique({
        where: { id: milestone.pod.grantsPoolId },
        select: { ownerId: true },
      });

      if(!gpOwnerId){
        throw new Error("Grants Pool does not exist");
      }

      // !todo 校验提交之前需要检查国库余额是否充足

      //!todo 验证提交的transactionHash是否有效
       const safeTransaction = await PLATFORM_CHAINS[optimism.id]?.safeApiKit.getTransaction(input.transactionHash);
       console.log('safeTransaction', safeTransaction);
       if(!safeTransaction){
         throw new Error("Invalid TransactionHash");
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
        title: `Pod milestone delivery submitted`,
        content: `${milestone.pod.title} milestone delivery has been submitted, please review it in time!`
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
        throw new Error("Milestone does not exist");
      }

      // 检查当前用户是否是 Grants Pool 的拥有者
      if (milestone.pod.grantsPool.ownerId !== ctx.user!.id) {
        throw new Error("You do not have permission to review this Milestone");
      }

      // 检查milestone状态是否为REVIEWING
      if (milestone.status !== "REVIEWING") {
        throw new Error("Only Milestones with status REVIEWING can be reviewed");
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

      // 通过审核与最后一次拒绝，检查是否需要提供safeTransactionHash
      if(
        (input.approved && !input.safeTransactionHash) ||
        (!input.approved && currentDeliveryInfo.length >= 3 && !input.safeTransactionHash)
      ){
        throw new Error("safeTransactionHash is required");
      }

      // 确定新的milestone状态
      let newStatus;
      if (input.approved) {
        // 审核通过，milestone完成
        newStatus = MilestoneStatus.COMPLETED;
         //!todo 检查是safeTransaction
        const safeTransaction = await PLATFORM_CHAINS[optimism.id]?.safeApiKit.getTransaction(input.safeTransactionHash!);
        if(!safeTransaction){
          throw new Error("Invalid TransactionHash");
        }

        // 如果所有milestone都完成，则更新pod状态为COMPLETED
        const remainingActiveMilestones = await ctx.db.milestone.count({
          where: {
            podId: milestone.podId,
            status: MilestoneStatus.ACTIVE
          }
        });
        if(remainingActiveMilestones <= 0){
          await ctx.db.pod.update({
            where: { id: milestone.podId },
            data: { status: PodStatus.COMPLETED }
          });
        }
      } else if (currentDeliveryInfo.length >= 3) {
          //! 已经3次提交都被拒绝，milestone失败，需要存入退款
          newStatus = MilestoneStatus.TERMINATED;
          
          // 使用通用退款函数
          await handlePodRefund(
            ctx.db, 
            milestone.podId, 
            input.safeTransactionHash!, 
            "Milestone delivery rejected three times"
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
        title: `GP review result: ${input.approved ? 'Approved' : 'Rejected'}`,
        content: `Your Pod milestone delivery has been ${input.approved ? 'approved' : 'rejected'}. Comment: ${input.comment}`,
      });

      return updatedMilestone;
    }),


  // GP直接终止Pod（用于milestone超时等情况）
  terminatePod: protectedProcedure
    .input(initiatePodRefundSchema)
    .mutation(async ({ ctx, input }) => {
      // 检查Pod是否存在
      const pod = await ctx.db.pod.findUnique({
        where: { id: input.podId },
        include: { 
          grantsPool: true,
          milestones: {
            where: { status: MilestoneStatus.ACTIVE }
          },
          applicant: true
        },
      });

      if (!pod) {
        throw new Error("Pod does not exist");
      }

      // 检查当前用户是否是 Grants Pool 的拥有者
      if (pod.grantsPool.ownerId !== ctx.user!.id) {
        throw new Error("You do not have permission to terminate this Pod");
      }

      // 检查Pod状态是否允许终止
      if (pod.status === PodStatus.TERMINATED) {
        throw new Error("Pod has already been terminated and cannot be terminated again");
      }

      // 将所有ACTIVE状态的milestone设置为TERMINATED
      if (pod.milestones.length > 0) {
        await ctx.db.milestone.updateMany({
          where: { 
            podId: input.podId,
            status: MilestoneStatus.ACTIVE
          },
          data: { status: MilestoneStatus.TERMINATED }
        });
      }

      // 更新Pod状态为TERMINATED
      await ctx.db.pod.update({
        where: { id: input.podId },
        data: { status: PodStatus.TERMINATED }
      });

      // 通知Pod申请者
      await NotificationService.createNotification({
        type: NotificationType.POD_REVIEW,
        senderId: ctx.user.id,
        receiverId: pod.applicant.id,
        title: `Your Pod ${pod.title} has been terminated by the GP Owner due to delivery timeout`,
        content: `Your Pod has been terminated by the GP due to Milestone delivery timeout. Please complete the refund process!`,
      });

      return true;
    }),
};