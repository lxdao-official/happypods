import { z } from "zod";
import { protectedProcedure } from "~/server/api/trpc";
import { createPodSchema, updatePodSchema, rejectPodSchema, approvePodSchema } from "./schemas";
import { NotificationService } from "../notification/notification-service";
import { NotificationType, PodStatus } from "@prisma/client";
import { getBalance } from "../wallet/queries";
import { PLATFORM_CHAINS } from "~/lib/config";
import { optimism } from "viem/chains";

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

      // 当前用户是否有其他正在审核中的pod
      const existingReviewingPod = await ctx.db.pod.findFirst({
        where: {
          applicantId: ctx.user!.id,
          status: "REVIEWING"
        }
      });
      if (existingReviewingPod) {
        throw new Error("您已有正在审核中的Pod，请等待审核完成后再创建新的Pod");
      }

      // 当前milestone的总额是否超过可用总额
      const totalMilestoneAmount = input.milestones.reduce((sum, milestone) => sum + Number(milestone.amount), 0);
      const { rawBalance } = await getBalance({
        address: grantsPool.treasuryWallet,
        chainType: grantsPool.chainType,
        tokenType: input.currency,
      });
      if(totalMilestoneAmount > Number(rawBalance)) {
        throw new Error(`可用余额不足!`);
      }
      const { milestones, isCheck, ...podData } = input;

      // 创建前检查参数是否正确，正确才弹窗多签钱包创建
      if(isCheck) return true;

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

      // 检查建议id是否合法
      // 验证提交的transactionHash是否有效
      const safeTransaction = await PLATFORM_CHAINS[optimism.id]?.safeApiKit.getTransaction(input.transactionHash);
      console.log('safeTransaction', safeTransaction);
      if(!safeTransaction){
        throw new Error("TransactionHash无效");
      }

      // 更新Pod状态为IN_PROGRESS
      const updatedPod = await ctx.db.pod.update({
        where: { id: input.id },
        data: {
          status: PodStatus.IN_PROGRESS,
          approvedAt: new Date(),
        }
      });

      //!todo 消息通知

      return updatedPod;
    }),


}; 