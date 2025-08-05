import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicProcedure } from "~/server/api/trpc";

export const notificationQueries = {
  // 获取用户的所有通知列表（时间降序）
  getUserNotifications: publicProcedure
    .query(async ({ ctx }) => {
      if (!ctx.user) {
        return [];
      }
      const notifications = await ctx.db.notification.findMany({
        where: {
          receiverId: ctx.user.id,
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        }
      });

      return notifications;
    }),
    // 将当前用户所有通知标记为已读
    markAllNotificationsRead: publicProcedure
    .mutation(async ({ ctx }) => {
      await ctx.db.notification.updateMany({
        where: { receiverId: ctx.user!.id },
        data: { read: true },
      });
    }),
    // 将单独的通知标记为已读
    markNotificationRead: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.notification.update({
        where: { id: input.id, receiverId: ctx.user!.id },
        data: { read: true },
      });
    }),
}; 