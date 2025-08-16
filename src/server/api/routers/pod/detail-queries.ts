import { MilestoneStatus, PodStatus } from "@prisma/client";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc";
import { getBalance } from "../wallet/queries";

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

      return {
        ...pod,
        podTreasuryBalances: balances.rawBalance,
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