import { z } from "zod";
import { publicProcedure } from "~/server/api/trpc";
import { createUserSchema, updateUserSchema } from "./schemas";

export const userMutations = {
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
}; 