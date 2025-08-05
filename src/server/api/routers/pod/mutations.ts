import { z } from "zod";
import { protectedProcedure } from "~/server/api/trpc";
import { createPodSchema, updatePodSchema, rejectPodSchema, approvePodSchema, submitMilestoneDeliverySchema, reviewMilestoneDeliverySchema } from "./schemas";
import { NotificationService } from "../notification/notification-service";
import { NotificationType } from "@prisma/client";

export const podMutations = {
  // 创建Pod
  create: protectedProcedure
    .input(createPodSchema)
    .mutation(async ({ ctx, input }) => {
      // 验证用户信息是否完善
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.user!.id },
        select: { name: true, email: true, description: true },
      });

      if (!user?.name || !user?.email || !user?.description) {
        throw new Error("请先完善个人信息");
      }

      // 验证Grants Pool和RFP
      const grantsPool = await ctx.db.grantsPool.findUnique({
        where: { id: input.grantsPoolId },
        include: { rfps: true },
      });

      if (!grantsPool) {
        throw new Error("Grants Pool不存在");
      }

      // 验证milestone总额
      const treasuryBalances = grantsPool.treasuryBalances as Record<string, any> || {};
      const tokenBalance = treasuryBalances[input.currency];
      
      if (!tokenBalance) {
        throw new Error(`未找到币种 ${input.currency} 的余额信息`);
      }

      const available = parseFloat(tokenBalance.available || "0");
      const totalAmount = input.milestones.reduce((sum, milestone) => sum + milestone.amount, 0);

      if (totalAmount > available) {
        throw new Error(`里程碑总额 ${totalAmount} 超过了可用资金 ${available} ${input.currency}`);
      }

      const { milestones, ...podData } = input;

      // 创建Pod
      const pod = await ctx.db.pod.create({
        data: {
          grantsPoolId: podData.grantsPoolId,
          rfpId: podData.rfpId,
          walletAddress: podData.walletAddress,
          avatar: podData.avatar,
          title: podData.title,
          description: podData.description,
          links: podData.links as any,
          currency: podData.currency,
          tags: podData.tags,
          applicantId: ctx.user!.id as number,
        },
        include: {
          applicant: true,
          grantsPool: true,
          rfp: true,
        },
      });

      // 创建milestones
      if (milestones && milestones.length > 0) {
        const milestonePromises = milestones.map(milestone => 
          ctx.db.milestone.create({
            data: {
              podId: pod.id,
              title: milestone.title,
              description: milestone.description,
              amount: milestone.amount,
              deadline: new Date(milestone.deadline),
            },
          })
        );
        await Promise.all(milestonePromises);
      }

      await NotificationService.createNotification({
        type: NotificationType.POD_REVIEW,
        senderId: pod.applicantId,
        receiverId: pod.grantsPool.ownerId,
        title: `Pod审核通知`,
        content: `${user?.name} 向您提交了 <${pod.title}> 的Pod，请及时审核!`,
        params: {
          podId: pod.id,
        }
      });

      return pod;
    }),

  // 更新Pod
  update: protectedProcedure
    .input(updatePodSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      // 检查Pod是否存在且属于当前用户
      const existingPod = await ctx.db.pod.findUnique({
        where: { id },
      });

      if (!existingPod) {
        throw new Error("Pod不存在");
      }

      if (existingPod.applicantId !== ctx.user!.id) {
        throw new Error("没有权限修改此Pod");
      }

      const updatedPod = await ctx.db.pod.update({
        where: { id },
        data: updateData,
        include: {
          applicant: true,
          grantsPool: true,
        },
      });

      return updatedPod;
    }),

  // 删除Pod
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const existingPod = await ctx.db.pod.findUnique({
        where: { id: input.id },
      });

      if (!existingPod) {
        throw new Error("Pod不存在");
      }

      if (existingPod.applicantId !== ctx.user!.id) {
        throw new Error("没有权限删除此Pod");
      }

      await ctx.db.pod.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  // 拒绝Pod
  reject: protectedProcedure
    .input(rejectPodSchema)
    .mutation(async ({ ctx, input }) => {
      // 检查Pod是否存在
      const existingPod = await ctx.db.pod.findUnique({
        where: { id: input.id },
        include: { grantsPool: true },
      });

      if (!existingPod) {
        throw new Error("Pod不存在");
      }

      // 检查当前用户是否是 Grants Pool 的拥有者
      if (existingPod.grantsPool.ownerId !== ctx.user!.id) {
        throw new Error("没有权限拒绝此Pod");
      }

      // 检查Pod状态是否为REVIEWING
      if (existingPod.status !== "REVIEWING") {
        throw new Error("只能拒绝处于审核中状态的Pod");
      }

      // 更新Pod状态为REJECTED，并设置拒绝理由
      const updatedPod = await ctx.db.pod.update({
        where: { id: input.id },
        data: {
          status: "REJECTED",
          metadata: {
            rejectReason: input.rejectReason,
          },
        },
        include: {
          applicant: true,
          grantsPool: true,
          milestones: true,
        },
      });

      return updatedPod;
    }),

  // 通过Pod
  approve: protectedProcedure
    .input(approvePodSchema)
    .mutation(async ({ ctx, input }) => {
      // 检查Pod是否存在
      const existingPod = await ctx.db.pod.findUnique({
        where: { id: input.id },
        include: { 
          grantsPool: true,
          milestones: true,
        },
      });

      if (!existingPod) {
        throw new Error("Pod不存在");
      }

      // 检查当前用户是否是 Grants Pool 的拥有者
      if (existingPod.grantsPool.ownerId !== ctx.user!.id) {
        throw new Error("没有权限通过此Pod");
      }

      // 检查Pod状态是否为REVIEWING
      if (existingPod.status !== "REVIEWING") {
        throw new Error("只能通过处于审核中状态的Pod");
      }

      // 更新Pod状态为IN_PROGRESS
      const updatedPod = await ctx.db.pod.update({
        where: { id: input.id },
        data: {
          status: "IN_PROGRESS",
        },
        include: {
          applicant: true,
          grantsPool: true,
          milestones: true,
        },
      });

      return updatedPod;
    }),

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
          status: "REVIEWING",
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
        newStatus = "COMPLETED" as const;
      } else {
        // 审核拒绝
        if (currentDeliveryInfo.length >= 3) {
          // 已经3次提交都被拒绝，milestone失败
          newStatus = "REJECTED" as const;
          
          // 同时将Pod状态设置为TERMINATED
          await ctx.db.pod.update({
            where: { id: milestone.podId },
            data: { status: "TERMINATED" },
          });
        } else {
          // 还可以重新提交
          newStatus = "ACTIVE" as const;
        }
      }

      // 更新milestone
      const updatedMilestone = await ctx.db.milestone.update({
        where: { id: input.milestoneId },
        data: {
          deliveryInfo: updatedDeliveryInfo,
          status: newStatus,
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

      // 如果审核通过，需要更新treasuryBalances（模拟转账）
      if (input.approved) {
        const grantsPool = milestone.pod.grantsPool;
        const currentBalances = grantsPool.treasuryBalances as any || {};
        const currency = milestone.pod.currency;
        
        if (currentBalances[currency]) {
          const available = parseFloat(currentBalances[currency].available || "0");
          const funded = parseFloat(currentBalances[currency].funded || "0");
          const milestoneAmount = milestone.amount;
          
          // 更新余额：从available转移到funded
          const newAvailable = Math.max(0, available - milestoneAmount);
          const newFunded = funded + milestoneAmount;
          
          const updatedBalances = {
            ...currentBalances,
            [currency]: {
              ...currentBalances[currency],
              available: newAvailable.toString(),
              funded: newFunded.toString(),
            },
          };

          // 更新grantsPool的treasuryBalances
          await ctx.db.grantsPool.update({
            where: { id: grantsPool.id },
            data: { treasuryBalances: updatedBalances },
          });
        }
      }

      return updatedMilestone;
    }),
}; 