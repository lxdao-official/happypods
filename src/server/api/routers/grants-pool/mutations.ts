import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { protectedProcedure } from "~/server/api/trpc";
import { createGrantsPoolSchema, updateGrantsPoolSchema } from "./schemas";

export const grantsPoolMutations = {
  // 创建GrantsPool
  create: protectedProcedure
    .input(createGrantsPoolSchema)
    .mutation(async ({ ctx, input }) => {
      const { rfps, ...poolData } = input;
      const grantsPool = await ctx.db.grantsPool.create({
        data: {
          name: poolData.name,
          description: poolData.description,
          treasuryWallet: poolData.treasuryWallet,
          chainType: poolData.chainType,
          avatar: poolData.avatar,
          tags: poolData.tags,
          links: poolData.links,
          modInfo: poolData.modInfo as Prisma.InputJsonValue,
          treasuryBalances: poolData.treasuryBalances as Prisma.InputJsonValue,
          ownerId: ctx.user.id,
        },
      });
      // 批量插入RFPs
      if (rfps && rfps.length > 0) {
        await ctx.db.rfps.createMany({
          data: rfps.map(rfp => ({
            ...rfp,
            grantsPoolId: grantsPool.id
          }))
        });
      }
      // 返回带rfps的grantsPool
      return ctx.db.grantsPool.findUnique({
        where: { id: grantsPool.id },
        include: { rfps: true, owner: { select: { id: true, name: true, avatar: true } } }
      });
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

      if (
        existingGrantsPool.ownerId !== ctx.user.id &&
        ctx.user.role !== "ADMIN"
      ) {
        throw new Error("没有权限修改此GrantsPool");
      }

      const updatedGrantsPool = await ctx.db.grantsPool.update({
        where: { id },
        data: {
          ...updateData,
          modInfo: updateData.modInfo
            ? (updateData.modInfo as Prisma.InputJsonValue)
            : undefined,
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

      if (
        existingGrantsPool.ownerId !== ctx.user.id &&
        ctx.user.role !== "ADMIN"
      ) {
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
}; 