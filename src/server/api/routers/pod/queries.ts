import { z } from "zod";
import { protectedProcedure, publicProcedure } from "~/server/api/trpc";
import { getListSchema, validateMilestonesSchema } from "./schemas";
import { db } from "~/server/db";
import { MilestoneStatus } from "@prisma/client";

// 获取 pod 的余额相关数据
export const getPodAssets = async (podId: number) => {
  const pod = await db.pod.findUnique({
    where: { id: podId },
    include: {
      milestones: true,
      grantsPool: {
        select: {
          feeRate: true,
        },
      },
    },
  });
  const milestones = pod?.milestones;
  const totalAmount = milestones?.reduce((sum, milestone) => sum + Number(milestone.amount), 0);
  const totalActiveAmount = milestones?.filter((milestone) => milestone.status === MilestoneStatus.ACTIVE).reduce((sum, milestone) => sum + Number(milestone.amount), 0);
  return { 
    totalAmount,
    totalAmountWithFee: totalAmount ? totalAmount * (1 + Number(pod?.grantsPool?.feeRate)) : 0,
    totalActiveAmount,
    totalActiveAmountWithFee: totalActiveAmount ? totalActiveAmount * (1 + Number(pod?.grantsPool?.feeRate)) : 0,
  };
};

export const podQueries = {
  // 获取Grants Pool详细信息（包含RFP和token信息）
  getGrantsPoolDetails: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const grantsPool = await ctx.db.grantsPool.findUnique({
        where: { id: input.id },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              walletAddress: true,
            },
          },
          rfps: {
            where: {
              inactiveTime: null, // 只获取活跃的 RFP
            },
            orderBy: { createdAt: "asc" },
          },
        },
      });

      if (!grantsPool) {
        throw new Error("Grants Pool不存在");
      }
      
      return {
        ...grantsPool,
        availableTokens:{},
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

      const available = 0;
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

      // 获取总记录数
      const totalCount = await ctx.db.pod.count({ where });
      
      // 计算总页数
      const totalPages = Math.ceil(totalCount / limit);

      const pods = await ctx.db.pod.findMany({
        take: limit + 1,
        where,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: "desc" },
        include: {
          applicant: { select: { id: true, name: true, avatar: true } },
          grantsPool: { select: { id: true, name: true, avatar: true } },
          milestones: { orderBy: { createdAt: "asc" }, where: { status: { notIn: [MilestoneStatus.INACTIVE] } } },
          _count: { select: { milestones: true } },
        },
      });
      let nextCursor: typeof cursor | undefined = undefined;
      if (pods.length > limit) {
        const nextItem = pods.pop();
        nextCursor = nextItem!.id;
      }
      return { pods, nextCursor, totalPages, totalCount };
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
            where: { status: { notIn: [MilestoneStatus.INACTIVE] } }
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
        where: { 
          applicantId: ctx.user.id
        },
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