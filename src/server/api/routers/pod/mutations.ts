import { protectedProcedure } from "~/server/api/trpc";
import { createPodSchema, rejectPodSchema, approvePodSchema, editPodSchema } from "./schemas";
import { NotificationService } from "../notification/notification-service";
import { NotificationType, PodStatus } from "@prisma/client";
import { getBalance } from "../wallet/queries";
import { PodEditService } from "./edit-service";
import { z } from "zod";

export const podMutations = {
  // 创建Pod
  create: protectedProcedure
    .input(createPodSchema)
    .mutation(async ({ ctx, input }) => {
      // 验证用户信息是否完善
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.user.id },
        select: { name: true, email: true, description: true },
      });

      if (!user?.name || !user?.email || !user?.description) {
        throw new Error("Please complete your personal information first");
      }

      // 验证Grants Pool和RFP
      const grantsPool = await ctx.db.grantsPool.findUnique({
        where: { id: input.grantsPoolId },
        include: { rfps: true },
      });

      if (!grantsPool) {
        throw new Error("Grants Pool does not exist");
      }

      // 当前用户是否有其他正在审核中的pod
      const existingReviewingPod = await ctx.db.pod.findFirst({
        where: {
          applicantId: ctx.user.id,
          status: "REVIEWING"
        }
      });
      if (existingReviewingPod) {
        throw new Error("You already have a Pod under review. Please wait for the review to be completed before creating a new one.");
      }

      // 当前milestone的总额是否超过可用总额
      const totalMilestoneAmount = input.milestones.reduce((sum, milestone) => sum + Number(milestone.amount), 0);
      const { rawBalance } = await getBalance({
        address: grantsPool.treasuryWallet,
        chainType: grantsPool.chainType,
        tokenType: input.currency,
      });
      if(totalMilestoneAmount > Number(rawBalance)) {
        throw new Error(`Insufficient balance!`);
      }
      const { milestones, isCheck, ...podData } = input;

      // 创建前检查参数是否正确，正确才弹窗多签钱包创建
      if(isCheck) return true;
      if(!ctx.user.id) throw new Error("User does not exist");
      // 创建Pod
      const pod = await ctx.db.pod.create({
        data: {
          grantsPoolId: podData.grantsPoolId,
          rfpId: podData.rfpId,
          walletAddress: podData.walletAddress,
          avatar: podData.avatar,
          title: podData.title,
          description: podData.description,
          links: podData.links,
          currency: podData.currency,
          tags: podData.tags,
          applicantId: ctx.user.id,
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
        title: `Pod Review Notification`,
        content: `${user?.name} has submitted the <${pod.title}> Pod to you. Please review it in time!`,
        params: {
          podId: pod.id,
        }
      });

      return pod;
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
        throw new Error("Pod does not exist");
      }

      // 检查当前用户是否是 Grants Pool 的拥有者
      if (existingPod.grantsPool.ownerId !== ctx.user.id) {
        throw new Error("You do not have permission to reject this Pod");
      }

      // 检查Pod状态是否为REVIEWING
      if (existingPod.status !== "REVIEWING") {
        throw new Error("Only Pods in the reviewing state can be rejected");
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
      const pod = await ctx.db.pod.findUnique({
        where: { id: input.id },
        include: { 
          grantsPool: true,
          milestones: true,
        },
      });

      if (!pod) {
        throw new Error("Pod does not exist");
      }

      // 检查当前用户是否是 Grants Pool 的拥有者
      if (pod.grantsPool.ownerId !== ctx.user.id) {
        throw new Error("You do not have permission to approve this Pod");
      }

      // 检查Pod状态是否为REVIEWING
      if (pod.status !== PodStatus.REVIEWING) {
        throw new Error("Only Pods in the reviewing state can be approved");
      }

      // todo 检查建议id是否合法, 这部分删除，直接全部通过，金额处理统一在详情顶部组件处理
      /*
      const {totalAmountWithFee} = await getPodAssets(pod.id);
      const {from,to,amount} = await parseSafeTransactionHash(input.transactionHash, {
        from: pod.grantsPool.treasuryWallet,
        to: pod.walletAddress,
        amount: totalAmountWithFee.toString(),
      });

      const safeTransactionHash = pod.safeTransactionHash as Record<string, string>;
      safeTransactionHash[`${from}_${to}_${amount}`] = input.transactionHash;
      */

      // 更新Pod状态为IN_PROGRESS
      const updatedPod = await ctx.db.pod.update({
        where: { id: input.id },
        data: {
          status: PodStatus.IN_PROGRESS,
          approvedAt: new Date()
        }
      });

      await NotificationService.createNotification({
        type: NotificationType.POD_REVIEW,
        senderId: ctx.user.id,
        receiverId: pod.applicantId,
        title: `Pod Approved`,
        content: `Your <${pod.title}> Pod has been approved!`,
      });

      return updatedPod;
    }),

  // 编辑Pod（创建新版本）
  edit: protectedProcedure
    .input(editPodSchema)
    .mutation(async ({ ctx, input }) => {
      return await PodEditService.editPod(ctx as any, input);
    }),

  // 审核通过版本
  approveVersion: protectedProcedure
    .input(z.object({
      podId: z.number(),
      versionData: z.any(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { podId, versionData } = input;
      return await PodEditService.reviewVersion(ctx as any, podId, versionData, true);
    }),

  // 驳回版本
  rejectVersion: protectedProcedure
    .input(z.object({
      podId: z.number(),
      versionData: z.any(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { podId, versionData } = input;
      return await PodEditService.reviewVersion(ctx as any, podId, versionData, false);
    }),

}; 
