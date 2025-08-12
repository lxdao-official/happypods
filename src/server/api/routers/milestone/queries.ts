import { MilestoneStatus, PodStatus, type GrantsPoolTokens } from "@prisma/client";
import { z } from "zod";
import { publicProcedure } from "~/server/api/trpc";
import { FEE_CONFIG, PLATFORM_TREASURY_ADDRESS, PLATFORM_CHAINS, CHAIN_MAP } from "~/lib/config";
import Decimal from "decimal.js";

export const milestoneQueries = {
    // 获取详情
    getDetail: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const milestone = await ctx.db.milestone.findUnique({
        where: { id: input.id },
        include: {
          pod: {
            select: {
              currency: true,
            },
          },
        },
      });
      return milestone;
    }),
  // 获取Pod的里程碑详情（包含待交付状态判断）
  getPodMilestones: publicProcedure
    .input(z.object({ podId: z.number() }))
    .query(async ({ ctx, input }) => {
      const milestones = await ctx.db.milestone.findMany({
        where: { podId: input.podId },
        orderBy: { deadline: "asc" },
        include: {
          pod: {
            select: {
              status: true,
            },
          },
        },
      });

      // 找到第一个状态为ACTIVE的milestone的index，并且没有待支付的milestone
      const activeMilestone = milestones.find(v=>v.status === MilestoneStatus.ACTIVE);
      const pendingPaymentMilestone = milestones.some(v=>v.status === MilestoneStatus.PENDING_PAYMENT);
      if(activeMilestone && activeMilestone.pod.status === PodStatus.IN_PROGRESS && !pendingPaymentMilestone){
        activeMilestone.status = MilestoneStatus.PENDING_DELIVERY;
      }
      
      return milestones;
    }),

  // 获取构建里程碑支付交易所需的数据
  getPaymentTransactionData: publicProcedure
    .input(z.object({ milestoneId: z.number() }))
    .query(async ({ ctx, input }) => {
      const milestone = await ctx.db.milestone.findUnique({
        where: { id: input.milestoneId },
        include: {
          pod: {
            include: {
              applicant: {
                select: {
                  walletAddress: true,
                },
              },
              grantsPool: {
                select: {
                  treasuryWallet: true,
                  chainType: true,
                }
              }
            }
          }
        }
      });

      if (!milestone) {
        throw new Error("Milestone not found");
      }

      const { pod } = milestone;
      const milestoneAmount = new Decimal(milestone.amount.toString())//.mul(10**6);
      
      // 计算手续费
      const fee = Decimal.max(
        milestoneAmount.mul(FEE_CONFIG.TRANSACTION_FEE_RATE),
        FEE_CONFIG.MIN_TRANSACTION_FEE
      );

      // 构建两个交易的数据结构
      const transactions = [
        // 1. 给pod创建者转账里程碑金额
        {
          token: pod.currency as GrantsPoolTokens,
          to: pod.applicant.walletAddress,
          amount: milestoneAmount.toString(),
        },
        // 2. 给平台转账手续费
        {
          token: pod.currency as GrantsPoolTokens,
          to: PLATFORM_TREASURY_ADDRESS,
          amount: fee.toString(),
        },
      ];

      return {
        transactions,
        treasuryWallet: pod.walletAddress,
        totalAmount: milestoneAmount.plus(fee).toString(),
        milestoneAmount: milestoneAmount.toString(),
        fee: fee.toString(),
        currency: pod.currency,
      };
    }),
};