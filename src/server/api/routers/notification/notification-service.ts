import { type NotificationType } from "@prisma/client";
import { db } from "~/server/db";
import { createNotificationSchema } from "./schemas";

// 通知服务类
export class NotificationService {
  /**
   * 创建通知的通用方法
   * @param type 通知类型
   * @param senderId 发送者ID
   * @param receiverId 接收者ID
   * @param title 通知标题
   * @param content 通知内容
   * @param params 额外参数
   * @param metadata 元数据
   */
  static async createNotification({
    type,
    senderId,
    receiverId,
    title,
    content,
    params,
    metadata,
  }: {
    type: NotificationType;
    senderId: number;
    receiverId: number;
    title: string;
    content: string;
    params?: Record<string, any>;
    metadata?: Record<string, any>;
  }) {
    try {
      const data = {
        type,
        senderId,
        receiverId,
        title,
        content,
        params: params || {},
        metadata: metadata || {},
      }
      console.log('Create notification ===>', data);
      // 校验解析
      createNotificationSchema.parse(data);
      const notification = await db.notification.create({
        data,
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
    } catch (error) {
      console.error("Failed to create notification:", error);
      throw error;
    }
  }
} 