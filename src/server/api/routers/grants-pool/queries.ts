import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc";
import { getAllSchema } from "./schemas";

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
        ...(status && { status }),
        ...(chainType && { chainType }),
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
        rfps: {
          where: {
            inactiveTime: null,
          }
        },
        chainType: true,
      },
    });

    return grantsPools;
  }),
}; 