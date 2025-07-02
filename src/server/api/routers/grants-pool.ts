import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc";

const createGrantsPoolSchema = z.object({
  avatar: z.string().url().optional(),
  name: z.string().min(1, "GP名称不能为空"),
  description: z.string().min(1, "GP描述不能为空"),
  links: z.any().optional(),
  tags: z.string().optional(),
  rfp: z.any(),
  modInfo: z.any(),
  treasuryWallet: z.string().min(1, "国库钱包地址不能为空"),
  chainType: z.enum(["ETHEREUM", "OPTIMISM"]),
});

const updateGrantsPoolSchema = z.object({
  id: z.number(),
  avatar: z.string().url().optional(),
  name: z.string().min(1, "GP名称不能为空").optional(),
  description: z.string().min(1, "GP描述不能为空").optional(),
  links: z.any().optional(),
  tags: z.string().optional(),
  rfp: z.any().optional(),
  modInfo: z.any().optional(),
  treasuryWallet: z.string().min(1, "国库钱包地址不能为空").optional(),
  chainType: z.enum(["ETHEREUM", "OPTIMISM"]).optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]).optional(),
});

export const grantsPoolRouter = createTRPCRouter({
  // 创建GrantsPool
  create: protectedProcedure
    .input(createGrantsPoolSchema)
    .mutation(async ({ ctx, input }) => {
      const grantsPool = await ctx.db.grantsPool.create({
        data: {
          name: input.name,
          description: input.description,
          treasuryWallet: input.treasuryWallet,
          chainType: input.chainType,
          avatar: input.avatar,
          tags: input.tags,
          links: input.links,
          rfp: input.rfp ?? null,
          modInfo: input.modInfo ?? null,
          ownerId: ctx.user.id,
        },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
      });
      return grantsPool;
    }),

  // 获取GrantsPool列表
  getAll: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        cursor: z.number().nullish(),
        search: z.string().optional(),
        status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]).optional(),
        chainType: z.enum(["ETHEREUM", "OPTIMISM"]).optional(),
      }).optional()
    )
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
  getMyGrantsPools: protectedProcedure
    .query(async ({ ctx }) => {
      const grantsPools = await ctx.db.grantsPool.findMany({
        where: { ownerId: ctx.user.id },
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: {
              pods: true,
            },
          },
        },
      });

      return grantsPools;
    }),

  // 更新GrantsPool
  update: protectedProcedure
    .input(updateGrantsPoolSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      // 检查GrantsPool是否存在且属于当前用户
      const existingGrantsPool = await ctx.db.grantsPool.findUnique({
        where: { id },
      });

      if (!existingGrantsPool) {
        throw new Error("GrantsPool不存在");
      }

      if (existingGrantsPool.ownerId !== ctx.user.id && ctx.user.role !== "ADMIN") {
        throw new Error("没有权限修改此GrantsPool");
      }

      const updatedGrantsPool = await ctx.db.grantsPool.update({
        where: { id },
        data: updateData,
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
      });

      return updatedGrantsPool;
    }),

  // 删除GrantsPool
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const existingGrantsPool = await ctx.db.grantsPool.findUnique({
        where: { id: input.id },
        include: {
          _count: {
            select: {
              pods: true,
            },
          },
        },
      });

      if (!existingGrantsPool) {
        throw new Error("GrantsPool不存在");
      }

      if (existingGrantsPool.ownerId !== ctx.user.id && ctx.user.role !== "ADMIN") {
        throw new Error("没有权限删除此GrantsPool");
      }

      if (existingGrantsPool._count.pods > 0) {
        throw new Error("该GrantsPool下还有Pod，无法删除");
      }

      await ctx.db.grantsPool.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  // 获取活跃的GrantsPool（用于Pod创建时选择）
  getActiveGrantsPools: publicProcedure
    .query(async ({ ctx }) => {
      const grantsPools = await ctx.db.grantsPool.findMany({
        where: { status: "ACTIVE" },
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          avatar: true,
          rfp: true,
          chainType: true,
        },
      });

      return grantsPools;
    }),
}); 