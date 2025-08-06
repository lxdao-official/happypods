import { NotificationType } from "@prisma/client";
import { z } from "zod";

// 创建通知的schema
export const createNotificationSchema = z.object({
  type: z.enum(Object.values(NotificationType) as [string, ...string[]]),
  senderId: z.number(),
  receiverId: z.number(),
  title: z.string(),
  content: z.string(),
  params: z.record(z.any()).optional(),
  metadata: z.record(z.any()).optional(),
});

// 获取用户通知列表的schema
export const getUserNotificationsSchema = z.object({
  userId: z.number(),
  limit: z.number().optional().default(50),
  offset: z.number().optional().default(0),
});

// 标记通知为已读的schema
export const markNotificationReadSchema = z.object({
  notificationId: z.number(),
});

// 标记所有通知为已读的schema
export const markAllNotificationsReadSchema = z.object({
  userId: z.number(),
});

// 删除通知的schema
export const deleteNotificationSchema = z.object({
  notificationId: z.number(),
}); 