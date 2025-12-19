import { protectedProcedure } from "~/server/api/trpc";
import { createPodSchema, rejectPodSchema, approvePodSchema, editPodSchema } from "./schemas";
import { NotificationService } from "../notification/notification-service";
import { GrantsPoolTokens, MilestoneStatus, NotificationType, PodStatus } from "@prisma/client";
import { getBalance } from "../wallet/queries";
import { PodEditService } from "./edit-service";
import { z } from "zod";
import { PLATFORM_CHAINS, PLATFORM_MOD_ADDRESS } from "~/lib/config";
import { buildErc20SafeTransactionAndHash, isUserInMultiSigWallet } from "~/lib/safeUtils";
import { optimism } from "viem/chains";
import Decimal from "decimal.js";
import { delay_s } from "~/lib/utils";


// 通用的退款逻辑函数
export const handlePodTermited = async (
  db: any,
  podId: number,
  ctx: any,
  reason?: string
) => {
  // 权限查询
  // 检查Pod是否存在
  const pod = await ctx.db.pod.findUnique({
    where: { id: podId },
    include: { 
      grantsPool: true,
      milestones: {
        where: { status: MilestoneStatus.ACTIVE }
      },
      applicant: true
    },
  });

  if (!pod) throw new Error("Pod does not exist");

  // 检查当前用户是否是 Grants Pool 的拥有者
  if (pod.grantsPool.ownerId !== ctx.user!.id) throw new Error("You do not have permission to terminate this Pod");

  // 检查Pod状态是否允许终止
  if (pod.status === PodStatus.TERMINATED) throw new Error("Pod has already been terminated and cannot be terminated again");

  // 更新Pod状态为TERMINATED
  const updatedPod = await db.pod.update({
    where: { id: podId },
    data: { 
      status: PodStatus.TERMINATED
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

  // 通知用户
  await NotificationService.createNotification({
    type: NotificationType.POD_REVIEW,
    senderId: ctx.user.id,
    receiverId: updatedPod.applicant.id,
    title: `Your Pod ${updatedPod.title} has been terminated`,
    content: reason ?? `Your Pod has been terminated by the GP. Please complete the refund process!`,
  });

  return updatedPod;
};

export const podMutations = {
  // 创建Pod
  create: protectedProcedure
    .input(createPodSchema)
    .mutation(async ({ ctx, input }) => {
      // 检查24小时内创建的pod数量限制，最多不超过 3 个
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentPodsCount = await ctx.db.pod.count({
        where: {
          applicantId: ctx.user.id,
          createdAt: {
            gte: twentyFourHoursAgo
          }
        }
      });

      if (recentPodsCount >= 3) throw new Error("You can only create up to 3 pods within 24 hours");

      // 验证用户信息是否完善
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.user.id },
        select: { name: true, email: true, description: true, walletAddress: true },
      });

      if (!user?.name || !user?.email || !user?.description) throw new Error("Please complete your personal information first");

      // 验证Grants Pool和RFP
      const grantsPool = await ctx.db.grantsPool.findUnique({
        where: { id: input.grantsPoolId },
        include: { rfps: true, owner: true },
      });

      if (!grantsPool) throw new Error("Grants Pool does not exist");

      // GP 创建者不能申请自己的 Pod
      if (grantsPool.ownerId === ctx.user.id) throw new Error("You cannot apply for your own Grants Pool");

      // 当前milestone的总额是否超过可用总额
      const totalMilestoneAmount = input.milestones.reduce(
        (sum, milestone) => sum.plus(new Decimal(milestone.amount)),
        new Decimal(0)
      );
      const { formattedBalance } = await getBalance({
        address: grantsPool.treasuryWallet,
        chainType: grantsPool.chainType,
        tokenType: input.currency,
      });
      
      if(totalMilestoneAmount.div(10**6).gt(formattedBalance)) throw new Error(`grants pool insufficient balance`);
     
      const { milestones, isCheck, ...podData } = input;
      // 创建前检查参数是否正确，正确才弹窗多签钱包创建
      if(isCheck) return true;

      // 检查当前钱包地址是否是多签钱包的签名者
      await delay_s(3000); //默认延迟 3s，等待钱包创建确认
      const isMultiSigWallet = await isUserInMultiSigWallet(
        input.walletAddress, 
        [user?.walletAddress, PLATFORM_MOD_ADDRESS, grantsPool.treasuryWallet],
        2,
        true
      );

      if(!isMultiSigWallet) throw new Error("safe wallet is not a valid wallet");
      if(!ctx.user.id) throw new Error("User does not exist");
      if(!milestones || !milestones.length) throw new Error("Milestones are required");

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
          tags: podData.tags as any,
          applicantId: ctx.user.id,
        },
        include: {
          applicant: true,
          grantsPool: true,
          rfp: true,
        },
      });

      // 创建milestones（使用 createMany 批量创建，比 Promise.all 更高效）
      await ctx.db.milestone.createMany({
        data: milestones.map(milestone => ({
          podId: pod.id,
          title: milestone.title,
          description: milestone.description,
          amount: milestone.amount,
          deadline: new Date(milestone.deadline),
        })),
      });

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

      if (!existingPod) throw new Error("Pod does not exist");

      // 检查当前用户是否是 Grants Pool 的拥有者
      if (existingPod.grantsPool.ownerId !== ctx.user.id) throw new Error("You do not have permission to reject this Pod");

      // 检查Pod状态是否为REVIEWING
      if (existingPod.status !== "REVIEWING") throw new Error("Only Pods in the reviewing state can be rejected");

      // 更新Pod状态为REJECTED，并设置拒绝理由
      const updatedPod = await ctx.db.pod.update({
        where: { id: input.id },
        data: {
          status: PodStatus.REJECTED,
          metadata: {
            rejectReason: input.rejectReason,
          },
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

      if (!pod) throw new Error("Pod does not exist");

      // 检查当前用户是否是 Grants Pool 的拥有者
      if (pod.grantsPool.ownerId !== ctx.user.id) throw new Error("You do not have permission to approve this Pod");

      // 检查Pod状态是否为REVIEWING
      if (pod.status !== PodStatus.REVIEWING) throw new Error("Only Pods in the reviewing state can be approved");

      // 直接完成状态更改，在前端余额更新中处理金额的注入与退还
      /*
      //! 验证提交的transactionHash是否有效，必须是已提案，已执行的交易
      await delay_s(5000);// 立即提交可能有更新延迟，延迟2秒执行，确保找到交易
      const safeTransaction = await PLATFORM_CHAINS[optimism.id]?.safeApiKit.getTransaction(input.transactionHash);
      console.log('===>',safeTransaction,!safeTransaction , !safeTransaction?.isExecuted , !safeTransaction?.isSuccessful);
      if(!safeTransaction || !safeTransaction.isExecuted || !safeTransaction.isSuccessful){
        throw new Error("Invalid TransactionHash");
      }

       //! 验证输入的 hash 是否与预期一致，否则不允许修改状态
      const appliedAmount = pod.milestones.reduce((sum:Decimal, milestone:any) => sum.plus(milestone.amount), new Decimal(0));

      const { hash: expectedHash } = await buildErc20SafeTransactionAndHash(pod.grantsPool.treasuryWallet, [
        {
          token: pod.currency as GrantsPoolTokens,
          from: pod.grantsPool.treasuryWallet,
          to: pod.walletAddress,
          amount: appliedAmount.toString(),
        }
      ]);

      console.log('expectedHash===>',expectedHash);

      if(expectedHash.toLocaleLowerCase() !== input.transactionHash.toLocaleLowerCase()){
        throw new Error("Invalid TransactionHash");
      }
      // !
      */

      // 更新Pod状态直接更改为IN_PROGRESS，支付解耦到资金判断去操作
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
      return await PodEditService.editPod(ctx as any, input as any);
    }),

  // 审核通过版本
  approveVersion: protectedProcedure
    .input(z.object({
      podId: z.number()
    }))
    .mutation(async ({ ctx, input }) => {
      return PodEditService.reviewLatestVersion(ctx as any, input.podId, true);
    }),

  // 驳回版本
  rejectVersion: protectedProcedure
    .input(z.object({
      podId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      return PodEditService.reviewLatestVersion(ctx as any, input.podId, false);
    }),

}; 
