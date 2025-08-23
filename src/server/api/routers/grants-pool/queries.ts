import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc";
import { getAllSchema } from "./schemas";
import type { ChainType, GrantsPoolStatus } from "@prisma/client";

export const grantsPoolQueries = {
  // 获取GrantsPool列表
  getAll: publicProcedure
    .input(getAllSchema)
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 50;
      const { cursor, search, status, chainType } = input ?? {};

      const where = {
        ...(search && {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { description: { contains: search, mode: "insensitive" as const } },
          ],
        }),
        ...(status && { status: status as GrantsPoolStatus }),
        ...(chainType && { chainType: chainType as ChainType }),
      };

      const grantsPools = await ctx.db.grantsPool.findMany({
        take: limit + 1,
        where,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: "desc" },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
          rfps: {
            where: {
              inactiveTime: null,
            },
          },
          _count: {
            select: {
              pods: true,
            },
          },
        },
      });

      let nextCursor: typeof cursor | undefined = undefined;
      if (grantsPools.length > limit) {
        const nextItem = grantsPools.pop();
        nextCursor = nextItem!.id;
      }

      return {
        grantsPools,
        nextCursor,
      };
    }),

  // 根据ID获取GrantsPool详情
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const grantsPool = await ctx.db.grantsPool.findUnique({
        where: { id: input.id },
        include: {
          owner: true,
          rfps: {
            where: {
              inactiveTime: null,
            }
          },
          pods: {
            include: {
              applicant: {
                select: {
                  id: true,
                  name: true,
                  avatar: true,
                },
              },
            },
            orderBy: { createdAt: "desc" },
          },
        },
      });

      if (!grantsPool) {
        throw new Error("GrantsPool不存在");
      }

      return grantsPool;
    }),

  // 获取当前用户的GrantsPool列表
  getMyGrantsPools: protectedProcedure.query(async ({ ctx }) => {
    const grantsPools = await ctx.db.grantsPool.findMany({
      where: { ownerId: ctx.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        rfps: {
          where: {
            inactiveTime: null,
          }
        },
        _count: {
          select: {
            pods: true,
          },
        },
      },
    });

    return grantsPools;
  }),

  // 判断当前用户是否存在GrantsPool
  isUserHasGrantsPool: protectedProcedure.query(async ({ ctx }) => {
    const grantsPool = await ctx.db.grantsPool.findFirst({
      where: { ownerId: ctx.user.id },
    });
    return !!grantsPool;
  }),

  // 获取活跃的GrantsPool（用于Pod创建时选择）
  getActiveGrantsPools: publicProcedure.query(async ({ ctx }) => {
    const grantsPools = await ctx.db.grantsPool.findMany({
      where: { status: "ACTIVE" },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        avatar: true,
        tokens: true,
        treasuryWallet: true,
        chainType: true,
        owner: {
          select: {
            walletAddress: true,
          },
        },
        rfps: {
          where: {
            inactiveTime: null,
          }
        },
      },
    });

    return grantsPools;
  }),

  // 获取资金池余额信息
  getPoolBalance: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      // 获取 GrantsPool 信息
      const grantsPool = await ctx.db.grantsPool.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          chainType: true,
          treasuryWallet: true,
        },
      });

      if (!grantsPool) {
        throw new Error("GrantsPool不存在");
      }

      // 获取所有已完成的milestone金额总和
      const completedMilestones = await ctx.db.milestone.aggregate({
        where: {
          pod: {
            grantsPoolId: input.id,
          },
          status: "COMPLETED",
        },
        _sum: {
          amount: true,
        },
      });

      // 获取所有milestone金额总和
      const totalMilestones = await ctx.db.milestone.aggregate({
        where: {
          pod: {
            grantsPoolId: input.id,
          },
          status: {
            in: ['APPROVED', 'COMPLETED', 'ACTIVE','REVIEWING'],
          },
        },
        _sum: {
          amount: true,
        },
      });

      const completedAmount = completedMilestones._sum.amount || 0;
      const totalAmount = totalMilestones._sum.amount || 0;

      return {
        grantsPool,
        completedAmount,
        totalAmount,
      };
    }),
}; 