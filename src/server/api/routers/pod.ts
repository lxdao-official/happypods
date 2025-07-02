import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc";

const createPodSchema = z.object({
  grantsPoolId: z.number(),
  rfpIndex: z.number(),
  avatar: z.string().url().optional(),
  name: z.string().min(1, "Pod名称不能为空"),
  shortDescription: z.string().min(1, "简短描述不能为空"),
  detailDescription: z.string().min(1, "详细描述不能为空"),
  links: z.any().optional(),
  currency: z.string().min(1, "币种不能为空"),
});

const updatePodSchema = z.object({
  id: z.number(),
  avatar: z.string().url().optional(),
  name: z.string().min(1, "Pod名称不能为空").optional(),
  shortDescription: z.string().min(1, "简短描述不能为空").optional(),
  detailDescription: z.string().min(1, "详细描述不能为空").optional(),
  links: z.any().optional(),
  currency: z.string().min(1, "币种不能为空").optional(),
  status: z.enum(["REVIEWING", "APPROVED", "REJECTED", "IN_PROGRESS", "COMPLETED", "TERMINATED"]).optional(),
});

export const podRouter = createTRPCRouter({
  // 创建Pod
  create: protectedProcedure
    .input(createPodSchema)
    .mutation(async ({ ctx, input }) => {
      const pod = await ctx.db.pod.create({
        data: {
          ...input,
          applicantId: ctx.user.id,
        },
        include: {
          applicant: true,
          grantsPool: true,
        },
      });
      return pod;
    }),

  // 获取Pod列表
  getAll: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        cursor: z.number().nullish(),
        search: z.string().optional(),
        status: z.enum(["REVIEWING", "APPROVED", "REJECTED", "IN_PROGRESS", "COMPLETED", "TERMINATED"]).optional(),
        grantsPoolId: z.number().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 50;
      const { cursor, search, status, grantsPoolId } = input ?? {};

      const where = {
        ...(search && {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { shortDescription: { contains: search, mode: "insensitive" as const } },
          ],
        }),
        ...(status && { status }),
        ...(grantsPoolId && { grantsPoolId }),
      };

      const pods = await ctx.db.pod.findMany({
        take: limit + 1,
        where,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: "desc" },
        include: {
          applicant: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
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

      let nextCursor: typeof cursor | undefined = undefined;
      if (pods.length > limit) {
        const nextItem = pods.pop();
        nextCursor = nextItem!.id;
      }

      return {
        pods,
        nextCursor,
      };
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

  // 更新Pod
  update: protectedProcedure
    .input(updatePodSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      // 检查Pod是否存在且属于当前用户
      const existingPod = await ctx.db.pod.findUnique({
        where: { id },
      });

      if (!existingPod) {
        throw new Error("Pod不存在");
      }

      if (existingPod.applicantId !== ctx.user.id && ctx.user.role !== "ADMIN") {
        throw new Error("没有权限修改此Pod");
      }

      const updatedPod = await ctx.db.pod.update({
        where: { id },
        data: updateData,
        include: {
          applicant: true,
          grantsPool: true,
        },
      });

      return updatedPod;
    }),

  // 删除Pod
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const existingPod = await ctx.db.pod.findUnique({
        where: { id: input.id },
      });

      if (!existingPod) {
        throw new Error("Pod不存在");
      }

      if (existingPod.applicantId !== ctx.user.id && ctx.user.role !== "ADMIN") {
        throw new Error("没有权限删除此Pod");
      }

      await ctx.db.pod.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),
}); 