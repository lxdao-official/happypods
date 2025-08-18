import { MilestoneStatus, PodStatus } from "@prisma/client";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc";
import { getBalance } from "../wallet/queries";
import Decimal from "decimal.js";

export const podDetailQueries = {
  // 获取Pod详情（包含完整信息）
  getPodDetail: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const pod = await ctx.db.pod.findUnique({
        where: { id: input.id },
        include: {
          applicant: {
            select: {
              id: true,
              name: true,
              avatar: true,
              walletAddress: true,
              email: true,
              description: true,
              links: true,
            },
          },
          grantsPool: {
            select: {
              id: true,
              name: true,
              avatar: true,
              ownerId: true,
              chainType: true,
              treasuryWallet: true,  
            },
          },
          rfp: {
            select: {
              id: true,
              title: true,
              description: true,
            },
          },
          milestones: {
            orderBy: { createdAt: "asc" },
          },
        },
      });

      if (!pod) {
        throw new Error("Pod不存在");
      }

      const balances = await getBalance({
        address: pod.walletAddress,
        chainType: pod.grantsPool.chainType,
        tokenType: pod.currency,
      });

      const milestones = await ctx.db.milestone.findMany({
        where: { podId: pod.id },
      });

      const appliedAmount = milestones.filter(milestone => ![MilestoneStatus.TERMINATED, MilestoneStatus.INACTIVE, MilestoneStatus.COMPLETED].includes(milestone.status as any)).reduce((acc, milestone) => Decimal(acc).plus(milestone.amount).toNumber(), 0);
      const funded = milestones.filter(milestone => milestone.status === MilestoneStatus.COMPLETED).reduce((acc, milestone) => Decimal(acc).plus(milestone.amount).toNumber(), 0);

      return {
        ...pod,
        podTreasuryBalances: balances.rawBalance,
        appliedAmount: appliedAmount,
        funded: funded
      };
    }),

  // 获取Pod历史显示数据
  getPodHistory: publicProcedure
    .input(z.object({ podId: z.number(), versionId: z.number() }))
    .query(async ({ ctx, input }) => {
      const pod = await ctx.db.pod.findFirst({
        where: { id: input.podId },
        select: { versions: true }
      });
      return {
        versions: pod?.versions || []
      };
    }),
};