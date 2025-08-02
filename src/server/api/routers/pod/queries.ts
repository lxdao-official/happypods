import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc";
import { getListSchema, validateMilestonesSchema } from "./schemas";

export const podQueries = {
  // 检查用户信息是否完善
  checkUserProfile: protectedProcedure
    .query(async ({ ctx }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.user.id },
        select: {
          name: true,
          email: true,
          description: true,
        },
      });

      if (!user) {
        throw new Error("用户不存在");
      }

      const isComplete = !!(user.name && user.email && user.description);
      return { isComplete, user };
    }),

  // 获取Grants Pool详细信息（包含RFP和token信息）
  getGrantsPoolDetails: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const grantsPool = await ctx.db.grantsPool.findUnique({
        where: { id: input.id },
        include: {
          rfps: {
            orderBy: { createdAt: "asc" },
          },
        },
      });

      if (!grantsPool) {
        throw new Error("Grants Pool不存在");
      }

      // 解析treasury balances获取可用token
      const treasuryBalances = grantsPool.treasuryBalances as Record<string, any> || {};
      const availableTokens = Object.entries(treasuryBalances)
        .filter(([_, balance]) => parseFloat(balance.available || "0") > 0)
        .map(([token, balance]) => ({
          symbol: token,
          available: balance.available,
        }));

      return {
        ...grantsPool,
        availableTokens,
      };
    }),

  // 验证milestone总额
  validateMilestones: publicProcedure
    .input(validateMilestonesSchema)
    .query(async ({ ctx, input }) => {
      const grantsPool = await ctx.db.grantsPool.findUnique({
        where: { id: input.grantsPoolId },
      });

      if (!grantsPool) {
        throw new Error("Grants Pool不存在");
      }

      const treasuryBalances = grantsPool.treasuryBalances as Record<string, any> || {};
      const tokenBalance = treasuryBalances[input.currency];
      
      if (!tokenBalance) {
        throw new Error(`未找到币种 ${input.currency} 的余额信息`);
      }

      const available = parseFloat(tokenBalance.available || "0");
      const totalAmount = input.milestones.reduce((sum, milestone) => sum + milestone.amount, 0);

      const isValid = totalAmount <= available;
      
      return {
        isValid,
        totalAmount,
        available,
        currency: input.currency,
      };
    }),

  // 获取Pod列表（支持分页、搜索、状态、gpId、我的）
  getList: protectedProcedure
    .input(getListSchema)
    .query(async ({ ctx, input }) => {
      const { limit, cursor, search, status, grantsPoolId, myOnly } = input;
      const where: any = {};
      if (search) {
        where.OR = [
          { title: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
          { tags: { contains: search, mode: "insensitive" } },
        ];
      }
      if (status) where.status = status;
      if (grantsPoolId) where.grantsPoolId = grantsPoolId;
      if (myOnly) where.applicantId = ctx.user.id;

      const pods = await ctx.db.pod.findMany({
        take: limit + 1,
        where,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: "desc" },
        include: {
          applicant: { select: { id: true, name: true, avatar: true } },
          grantsPool: { select: { id: true, name: true, avatar: true } },
          milestones: { orderBy: { createdAt: "asc" } },
          _count: { select: { milestones: true } },
        },
      });
      let nextCursor: typeof cursor | undefined = undefined;
      if (pods.length > limit) {
        const nextItem = pods.pop();
        nextCursor = nextItem!.id;
      }
      return { pods, nextCursor };
    }),

  // 根据ID获取Pod详情
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const pod = await ctx.db.pod.findUnique({
        where: { id: input.id },
        include: {
          applicant: true,
          grantsPool: true,
          milestones: {
            orderBy: { createdAt: "asc" },
          },
        },
      });

      if (!pod) {
        throw new Error("Pod不存在");
      }

      return pod;
    }),

  // 获取当前用户的Pod列表
  getMyPods: protectedProcedure
    .query(async ({ ctx }) => {
      const pods = await ctx.db.pod.findMany({
        where: { applicantId: ctx.user.id },
        orderBy: { createdAt: "desc" },
        include: {
          grantsPool: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
          _count: {
            select: {
              milestones: true,
            },
          },
        },
      });

      return pods;
    }),
}; 