import { protectedProcedure } from "~/server/api/trpc";
import { submitMilestoneDeliverySchema, reviewMilestoneDeliverySchema, confirmPaymentSchema } from "./schemas";
import { NotificationService } from "../notification/notification-service";
import { MilestoneStatus, NotificationType, PodStatus } from "@prisma/client";

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

      // 根据milestonesID查询gp创建者id与pod名称
      const gpOwnerId = await ctx.db.grantsPool.findUnique({
        where: { id: milestone.pod.grantsPoolId },
        select: { ownerId: true },
      });

      if(!gpOwnerId){
        throw new Error("Grants Pool不存在");
      }

      // 同时gp创建者
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
      
      // 检查deliveryIndex是否有效
      if (input.deliveryIndex < 0 || input.deliveryIndex >= currentDeliveryInfo.length) {
        throw new Error("无效的交付索引");
      }

      // 更新指定的交付信息
      const updatedDeliveryInfo = [...currentDeliveryInfo];
      updatedDeliveryInfo[input.deliveryIndex] = {
        ...updatedDeliveryInfo[input.deliveryIndex],
        approved: input.approved,
        reviewComment: input.comment,
        reviewedAt: new Date().toISOString(),
      };

      // 确定新的milestone状态
      let newStatus;
      if (input.approved) {
        // 审核通过，milestone完成
        newStatus = MilestoneStatus.PENDING_PAYMENT;
      } else {
        // 审核拒绝
        if (currentDeliveryInfo.length >= 3) {
          // 已经3次提交都被拒绝，milestone失败
          newStatus = MilestoneStatus.REJECTED;
          
          // 同时将Pod状态设置为TERMINATED
          await ctx.db.pod.update({
            where: { id: milestone.podId },
            data: { status: PodStatus.TERMINATED },
          });
        } else {
          // 还可以重新提交
          newStatus = MilestoneStatus.ACTIVE;
        }
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
};