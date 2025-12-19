import { protectedProcedure } from "~/server/api/trpc";
import { submitMilestoneDeliverySchema, reviewMilestoneDeliverySchema, initiatePodRefundSchema } from "./schemas";
import { NotificationService } from "../notification/notification-service";
import { GrantsPoolTokens, MilestoneStatus, NotificationType, PodStatus } from "@prisma/client";
import { PLATFORM_TREASURY_ADDRESS } from "~/lib/config";
import { handlePodTermited } from "../pod/mutations";
import { getBalance } from "../wallet/queries";
import { buildErc20SafeTransactionAndHash, getSafeTransactionWithRetry } from "~/lib/safeUtils";
import { delay_s } from "~/lib/utils";
import Decimal from "decimal.js";


export const milestoneMutations = {
  // 提交milestone交付
  submitMilestoneDelivery: protectedProcedure
    .input(submitMilestoneDeliverySchema)
    .mutation(async ({ ctx, input }) => {
      // 检查milestone是否存在
      const milestone = await ctx.db.milestone.findUnique({
        where: { id: input.milestoneId },
        include: { pod: { include: { grantsPool: true, applicant: true } } },
      });

      if (!milestone) throw new Error("Milestone does not exist");

      // 检查当前用户是否是Pod的申请者
      if (milestone.pod.applicantId !== ctx.user.id) throw new Error("You do not have permission to submit this Milestone");

      // 检查milestone状态是否为ACTIVE
      if (milestone.status !== "ACTIVE") throw new Error("Only Milestones with status ACTIVE can be submitted");

      // 获取当前的deliveryInfo数组
      const currentDeliveryInfo = (milestone.deliveryInfo as any[]) || [];
      
      // 检查提交次数是否超过3次
      if (currentDeliveryInfo.length >= 3) throw new Error("The maximum number of submissions (3) has been reached");

      // 根据milestonesID查询gp创建者id与pod名称
      const gpOwnerId = await ctx.db.grantsPool.findUnique({
        where: { id: milestone.pod.grantsPoolId },
        select: { ownerId: true },
      });

      if(!gpOwnerId) throw new Error("Grants Pool does not exist");

      // 校验提交之前需要检查国库余额是否足够支付 里程碑金额+手续费
      const balance = await getBalance({
        address: milestone.pod.grantsPool.treasuryWallet,
        chainType: milestone.pod.grantsPool.chainType,
        tokenType: "USDT",
      });
      if( Number(balance.rawBalance) < Decimal(milestone.amount).mul(1+Number(milestone.pod.grantsPool.feeRate)).toNumber() ) throw new Error("Grants Pool Insufficient balance");

      // 预计算预期的 Safe tx hash
      const { hash: expectedHash } = await buildErc20SafeTransactionAndHash(milestone.pod.walletAddress, [
        {
          token: milestone.pod.currency as GrantsPoolTokens,
          to: PLATFORM_TREASURY_ADDRESS,
          amount: Decimal(milestone.amount).mul(milestone.pod.grantsPool.feeRate).toString(),
        },
        {
          token: milestone.pod.currency as GrantsPoolTokens,
          to: milestone.pod.applicant.walletAddress,
          amount: milestone.amount.toString(),
        }
      ]);

      // 验证 Safe 里是否已有该提案且尚未执行
      try {
        const safeTransaction = await getSafeTransactionWithRetry(expectedHash);
        if (!safeTransaction || safeTransaction.isExecuted || safeTransaction.isSuccessful) {
          throw new Error("Safe transaction already executed");
        }
      } catch (err) {
        throw new Error("Safe transaction not proposed or unavailable, please submit in Safe first");
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
          safeTransactionHash: expectedHash,
        }
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
      const milestone = await ctx.db.milestone.findUnique({
        where: { id: input.milestoneId },
        include: {
          pod: {
            include: { grantsPool: true, applicant: true },
          },
        },
      });
      if (!milestone) throw new Error("Milestone does not exist");
      if (milestone.pod.grantsPool.ownerId !== ctx.user.id) throw new Error("You do not have permission to review this Milestone");
      if (milestone.status !== MilestoneStatus.REVIEWING) throw new Error("Only Milestones with status REVIEWING can be reviewed");
      if (milestone.pod.versions && Object.values(milestone.pod.versions).length > 0) throw new Error("The pod has no versions, please complete the pod review first");

      const submissions = (milestone.deliveryInfo as any[]) ?? [];
      if (!submissions.length) throw new Error("No delivery submission to review");
      const lastIndex = submissions.length - 1;
      const updatedDeliveryInfo = submissions.map((entry, idx) =>
        idx === lastIndex
          ? { ...entry, approved: input.approved, reviewComment: input.comment, reviewedAt: new Date().toISOString() }
          : entry
      );

      let newStatus: MilestoneStatus = milestone.status;

      if (input.approved) {
        if (!milestone.safeTransactionHash) throw new Error("safeTransactionHash is required");
        await ensureSafeTxExecuted(milestone.safeTransactionHash);
        newStatus = MilestoneStatus.COMPLETED;

        // 检查是否还有未完成的里程碑，如果全部完成，则更新Pod状态为COMPLETED
        const activeLeft = await ctx.db.milestone.count({
          where: { podId: milestone.podId, status: MilestoneStatus.ACTIVE },
        });
        if (activeLeft <= 0) {
          await ctx.db.pod.update({
            where: { id: milestone.podId },
            data: { status: PodStatus.COMPLETED },
          });
        }
      } else if (submissions.length >= 3) {
        newStatus = MilestoneStatus.TERMINATED;
        await handlePodTermited(ctx.db, milestone.podId, ctx, "Milestone delivery rejected three times");
      } else {
        newStatus = MilestoneStatus.ACTIVE;
      }

      const updatedMilestone = await ctx.db.milestone.update({
        where: { id: input.milestoneId },
        data: { deliveryInfo: updatedDeliveryInfo, status: newStatus },
      });

      await NotificationService.createNotification({
        type: NotificationType.POD_REVIEW,
        senderId: ctx.user.id,
        receiverId: milestone.pod.applicantId,
        title: `GP review result: ${input.approved ? "Approved" : "Rejected"}`,
        content: `Your Pod milestone delivery has been ${input.approved ? "approved" : "rejected"}. Comment: < ${input.comment} >`,
      });

      return updatedMilestone;
    }),


  // GP直接终止Pod（用于milestone超时等情况）
  terminatePod: protectedProcedure
    .input(initiatePodRefundSchema)
    .mutation(async ({ ctx, input }) => {
      await handlePodTermited(
        ctx.db, 
        input.podId, 
        ctx,
        "Milestone delivery rejected three times"
      );
      return true;
    }),
};

async function ensureSafeTxExecuted(safeTransactionHash: string) {
  for (let i = 0; i < 5; i++) {
    const tx = await getSafeTransactionWithRetry(safeTransactionHash);
    if (tx?.isExecuted && tx?.isSuccessful) return true;
    await delay_s(3000);
  }
  throw new Error("Please ensure the Safe transaction is executed successfully.");
}
