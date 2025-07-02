import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

// 定义用户输入校验 schema
const createUserSchema = z.object({
  avatar: z.string().url().optional(),
  name: z.string().min(1, "用户名称不能为空"),
  email: z.string().email("请输入有效的邮箱地址"),
  role: z.enum(["ADMIN", "GP_MOD", "APPLICANT", "VIEWER"]),
  description: z.string().optional(),
  links: z.record(z.string()).optional(), // 存储多个链接
});

const updateUserSchema = createUserSchema.partial().extend({
  id: z.number(),
});

export const userRouter = createTRPCRouter({
  // 创建用户
  create: publicProcedure
    .input(createUserSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.user.create({
        data: {
          avatar: input.avatar,
          name: input.name,
          email: input.email,
          role: input.role,
          description: input.description,
          links: input.links,
        },
      });
    }),

  // 根据 ID 获取用户
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: input.id },
      });
      return user;
    }),

  // 根据邮箱获取用户
  getByEmail: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { email: input.email },
      });
      return user;
    }),

  // 获取所有用户（分页）
  getAll: publicProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(10),
        search: z.string().optional(),
        role: z.enum(["ADMIN", "GP_MOD", "APPLICANT", "VIEWER"]).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const skip = (input.page - 1) * input.limit;
      
      const where = {
        ...(input.search && {
          OR: [
            { name: { contains: input.search, mode: "insensitive" as const } },
            { email: { contains: input.search, mode: "insensitive" as const } },
          ],
        }),
        ...(input.role && { role: input.role }),
      };

      const [users, total] = await Promise.all([
        ctx.db.user.findMany({
          where,
          skip,
          take: input.limit,
          orderBy: { createdAt: "desc" },
        }),
        ctx.db.user.count({ where }),
      ]);

      return {
        users,
        total,
        pages: Math.ceil(total / input.limit),
        currentPage: input.page,
      };
    }),

  // 更新用户
  update: publicProcedure
    .input(updateUserSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;
      
      return ctx.db.user.update({
        where: { id },
        data: updateData,
      });
    }),

  // 删除用户
  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.user.delete({
        where: { id: input.id },
      });
    }),

  // 检查邮箱是否已存在
  checkEmailExists: publicProcedure
    .input(z.object({ email: z.string().email(), excludeId: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { email: input.email },
      });
      
      // 如果是更新操作，排除当前用户
      if (input.excludeId && user?.id === input.excludeId) {
        return false;
      }
      
      return !!user;
    }),
}); 