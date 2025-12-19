import { z } from "zod";
import { protectedProcedure, publicProcedure } from "~/server/api/trpc";
import { checkEmailExistsSchema } from "./schemas";

export const userQueries = {  // 检查用户信息是否完善
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
  // 获取当前用户的数据
  getMe: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user.id) return null;
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
      },
    });
    return user;
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

  // 检查邮箱是否已存在
  checkEmailExists: publicProcedure
    .input(checkEmailExistsSchema)
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
}; 