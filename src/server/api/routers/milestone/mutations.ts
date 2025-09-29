import { protectedProcedure } from "~/server/api/trpc";
import { submitMilestoneDeliverySchema, reviewMilestoneDeliverySchema, initiatePodRefundSchema } from "./schemas";
import { NotificationService } from "../notification/notification-service";
import { GrantsPoolTokens, MilestoneStatus, NotificationType, PodStatus } from "@prisma/client";
import { optimism } from "viem/chains";
import { PLATFORM_TREASURY_ADDRESS } from "~/lib/config";
import { handlePodTermited } from "../pod/mutations";
import { getBalance } from "../wallet/queries";
import { buildErc20SafeTransactionAndHash, getSafeTransactionWithRetry } from "~/lib/safeUtils";
import { delay_s, withRetry } from "~/lib/utils";
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

      if (!milestone) {
        throw new Error("Milestone does not exist");
      }

      // 检查当前用户是否是Pod的申请者
      if (milestone.pod.applicantId !== ctx.user.id) {
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

      // 校验提交之前需要检查国库余额是否足够支付 里程碑金额+手续费
      const balance = await getBalance({
        address: milestone.pod.grantsPool.treasuryWallet,
        chainType: milestone.pod.grantsPool.chainType,
        tokenType: "USDT",
      });
      if( Number(balance.rawBalance) < Decimal(milestone.amount).mul(1+Number(milestone.pod.grantsPool.feeRate)).toNumber() ){
        throw new Error("Grants Pool Insufficient balance");
      }

      //! 验证提交的transactionHash是否有效，必须是已提案，但是未执行的交易
      const safeTransaction = await getSafeTransactionWithRetry(input.transactionHash);
      console.log(!safeTransaction , safeTransaction?.isExecuted , safeTransaction?.isSuccessful);
      if(!safeTransaction || safeTransaction.isExecuted || safeTransaction.isSuccessful){
        throw new Error("Invalid TransactionHash1");
      }

      //! 验证输入的 hash 是否与预期一致，否则不允许修改状态
      const user = await ctx.db.user.findUnique({
        where: {
          id: ctx.user.id,
        },
        select: {
          walletAddress: true,
        },
      })

      if(!user){throw new Error("User does not exist");}

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

      if(expectedHash.toLocaleLowerCase() !== input.transactionHash.toLocaleLowerCase()){
        throw new Error("Invalid TransactionHash2");
      }
      // !

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
      // 检查milestone是否存在
      const milestone = await ctx.db.milestone.findUnique({
        where: { id: input.milestoneId },
        include: { 
          pod: { 
            include: { grantsPool: true, applicant: true } 
          } 
        },
      });

      if (!milestone) {
        throw new Error("Milestone does not exist");
      }

      // 检查当前用户是否是 Grants Pool 的拥有者
      if (milestone.pod.grantsPool.ownerId !== ctx.user.id) {
        throw new Error("You do not have permission to review this Milestone");
      }

      // 检查milestone状态是否为REVIEWING
      if (milestone.status !== "REVIEWING") {
        throw new Error("Only Milestones with status REVIEWING can be reviewed");
      }

      // 检查是否有待审核的 pod 信息提交，如果有需要先完成审核，否则会出现完全成了 pod，后追加 milestone 的情况
      if(milestone.pod.versions && Object.values(milestone.pod.versions).length > 0){
        throw new Error("The pod has no versions, please complete the pod review first");
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

        if(!input.safeTransactionHash){
          throw new Error("safeTransactionHash is required");
        }

        // 审核通过，milestone完成
        newStatus = MilestoneStatus.COMPLETED;

        console.log('构建数据===>',milestone.pod.walletAddress, [
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

        //! 验证提交的transactionHash是否有效，必须是已提案，已执行的交易
        let transactionValidated = false;
        for(let i = 0; i < 5; i++){
          console.log('重试机制请求===>',i);
          const safeTransaction = await getSafeTransactionWithRetry(milestone.safeTransactionHash!);
          console.log('safeTransaction==>',safeTransaction);
          const status = safeTransaction?.isExecuted && safeTransaction?.isSuccessful ? 'success' : 'failed';
          if(status === 'success'){
            transactionValidated = true;
            break;
          }
          await delay_s(3000);
        }

        // 如果5次重试都失败，则终止并返回验证交易失败
        if (!transactionValidated) {
          throw new Error("Please ensure the transaction is properly executed.");
        }

        // !
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
          await handlePodTermited(
            ctx.db, 
            milestone.podId, 
            ctx,
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
        content: `Your Pod milestone delivery has been ${input.approved ? 'approved' : 'rejected'}. Comment: < ${input.comment} >`,
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