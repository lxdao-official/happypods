import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { protectedProcedure } from "~/server/api/trpc";
import { createGrantsPoolSchema, updateGrantsPoolSchema } from "./schemas";

export const grantsPoolMutations = {
  // 创建GrantsPool
  create: protectedProcedure
    .input(createGrantsPoolSchema)
    .mutation(async ({ ctx, input }) => {
      // 检查用户是否已经创建过 GrantsPool
      const existingGrantsPool = await ctx.db.grantsPool.findFirst({
        where: { ownerId: ctx.user.id }
      });

      if (existingGrantsPool) {
        throw new Error("You have already created a GrantsPool and cannot create another one.");
      }

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
          ownerId: ctx.user.id!,
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
      const { id, rfps, ...updateData } = input;

      // 检查GrantsPool是否存在且属于当前用户
      const existingGrantsPool = await ctx.db.grantsPool.findUnique({
        where: { id },
        include: {
          rfps: {
            where: {
              inactiveTime: null, // 只获取活跃的 RFP
            },
          },
        },
      });

      if (!existingGrantsPool) {
        throw new Error("GrantsPool does not exist");
      }

      if (existingGrantsPool.ownerId !== ctx.user.id) {
        throw new Error("You do not have permission to modify this GrantsPool");
      }

      // 更新 GrantsPool 基本信息
      await ctx.db.grantsPool.update({
        where: { id },
        data: {
          name: updateData.name,
          description: updateData.description,
          avatar: updateData.avatar,
          tags: updateData.tags,
          links: updateData.links,
          modInfo: updateData.modInfo as Prisma.InputJsonValue,
        },
      });

      // 处理 RFP 更新
      if (rfps && rfps.length > 0) {
        const existingRfpIds = existingGrantsPool.rfps.map(rfp => rfp.id);
        const inputRfpIds = rfps
          .filter(rfp => 'id' in rfp && rfp.id !== undefined)
          .map(rfp => (rfp as any).id);

        // 逻辑删除不在输入列表中的现有 RFP
        const rfpsToDelete = existingRfpIds.filter(id => !inputRfpIds.includes(id));
        if (rfpsToDelete.length > 0) {
          await ctx.db.rfps.updateMany({
            where: {
              id: { in: rfpsToDelete },
              grantsPoolId: id,
            },
            data: {
              inactiveTime: new Date(),
            },
          });
        }

        // 处理 RFP 的创建和更新
        for (const rfp of rfps) {
          if ('id' in rfp && rfp.id !== undefined) {
            // 更新现有 RFP
            await ctx.db.rfps.update({
              where: { id: (rfp as any).id },
              data: {
                title: rfp.title,
                description: rfp.description,
              },
            });
          } else {
            // 创建新 RFP
            await ctx.db.rfps.create({
              data: {
                title: rfp.title,
                description: rfp.description,
                grantsPoolId: id,
              },
            });
          }
        }
      }
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
        throw new Error("GrantsPool does not exist");
      }

      if (
        existingGrantsPool.ownerId !== ctx.user.id
      ) {
        throw new Error("You do not have permission to delete this GrantsPool");
      }

      if (existingGrantsPool._count.pods > 0) {
        throw new Error("There are still Pods under this GrantsPool, so it cannot be deleted");
      }

      await ctx.db.grantsPool.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  // 逻辑删除 RFP
  deleteRfp: protectedProcedure
    .input(z.object({ 
      rfpId: z.number(),
      grantsPoolId: z.number() 
    }))
    .mutation(async ({ ctx, input }) => {
      // 首先检查 GrantsPool 是否属于当前用户
      const grantsPool = await ctx.db.grantsPool.findUnique({
        where: { id: input.grantsPoolId },
      });

      if (!grantsPool) {
        throw new Error("GrantsPool does not exist");
      }

      if (
        grantsPool.ownerId !== ctx.user.id
      ) {
        throw new Error("You do not have permission to delete this RFP");
      }

      // 检查 RFP 是否存在且属于指定的 GrantsPool
      const rfp = await ctx.db.rfps.findFirst({
        where: {
          id: input.rfpId,
          grantsPoolId: input.grantsPoolId,
          inactiveTime: null, // 确保RFP当前是活跃的
        },
      });

      if (!rfp) {
        throw new Error("RFP does not exist or has been deleted");
      }

      // 逻辑删除 RFP
      await ctx.db.rfps.update({
        where: { id: input.rfpId },
        data: {
          inactiveTime: new Date(),
        },
      });

      return { success: true };
    }),
}; 