import { publicProcedure } from "~/server/api/trpc";
import { 
  createNotificationSchema,
  markNotificationReadSchema, 
  markAllNotificationsReadSchema,
  deleteNotificationSchema 
} from "./schemas";
import { type NotificationType } from "@prisma/client";

export const notificationMutations = {
  // 创建通知的通用方法
  createNotification: publicProcedure
    .input(createNotificationSchema)
    .mutation(async ({ ctx, input }) => {
      const notification = await ctx.db.notification.create({
        data: {
          type: input.type  as NotificationType,
          senderId: input.senderId,
          receiverId: input.receiverId,
          title: input.title,
          content: input.content,
          params: input.params || {},
          metadata: input.metadata || {},
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
      });

      return notification;
    }),

  // 标记单个通知为已读
  markAsRead: publicProcedure
    .input(markNotificationReadSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new Error("Unauthorized");
      const notification = await ctx.db.notification.update({
        where: { id: input.notificationId, receiverId: ctx.user.id },
        data: { read: true }
      });

      return notification;
    }),

  // 标记用户所有通知为已读
  markAllAsRead: publicProcedure
    .input(markAllNotificationsReadSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new Error("Unauthorized");
      const result = await ctx.db.notification.updateMany({
        where: {
          receiverId: ctx.user.id,
          read: false,
        },
        data: { read: true },
      });

      return {
        updatedCount: result.count,
      };
    })
}; 