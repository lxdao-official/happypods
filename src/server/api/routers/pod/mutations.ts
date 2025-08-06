import { z } from "zod";
import { protectedProcedure } from "~/server/api/trpc";
import { createPodSchema, updatePodSchema, rejectPodSchema, approvePodSchema } from "./schemas";
import { NotificationService } from "../notification/notification-service";
import { MilestoneStatus, NotificationType, PodStatus } from "@prisma/client";

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
          status: PodStatus.REJECTED,
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
      if (existingPod.status !== PodStatus.REVIEWING) {
        throw new Error("只能通过处于审核中状态的Pod");
      }

      // 更新Pod状态为IN_PROGRESS
      const updatedPod = await ctx.db.pod.update({
        where: { id: input.id },
        data: {
          status: PodStatus.PENDING_PAYMENT,
          approvedAt: new Date(),
        }
      });

      return updatedPod;
    }),


}; 