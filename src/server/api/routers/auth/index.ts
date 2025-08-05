import { z } from "zod";
import { verifyTypedData } from "viem";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { generateToken, verifyToken } from "./jwt";
import { verifySignatureSchema, validateTokenSchema } from "./schemas";
import { NotificationService } from "../notification/notification-service";
import { NotificationType } from "@prisma/client";

// 定义TypedData结构
const domain = {
  name: 'Happy Pods',
  version: '1',
} as const;

const types = {
  LoginMessage: [
    { name: 'message', type: 'string' },
    { name: 'nonce', type: 'string' },
    { name: 'timestamp', type: 'uint256' },
  ],
} as const;

export const authRouter = createTRPCRouter({
  // 获取随机nonce用于签名
  getNonce: publicProcedure.query(() => {
    const nonce = Math.random().toString(36).substring(2, 15);
    const timestamp = Math.floor(Date.now() / 1000);
    
    return {
      nonce,
      timestamp,
      message: `欢迎登录 Happy Pods！\n\n请签名此消息以验证您的身份。\n\nNonce: ${nonce}\nTimestamp: ${timestamp}`,
    };
  }),

  // 验证签名并生成JWT token
  verifySignature: publicProcedure
    .input(verifySignatureSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        // 解析消息中的时间戳
        const timestampRegex = /Timestamp: (\d+)/;
        const timestampMatch = timestampRegex.exec(input.message);
        if (!timestampMatch) {
          throw new Error("消息格式无效");
        }

        const timestamp = parseInt(timestampMatch[1]!);
        const currentTime = Math.floor(Date.now() / 1000);
        
        // 检查签名是否过期（5分钟内有效）
        if (currentTime - timestamp > 300) {
          throw new Error("签名已过期，请重新签名");
        }

        // 构造TypedData
        const typedData = {
          domain,
          types,
          primaryType: 'LoginMessage' as const,
          message: {
            message: input.message,
            nonce: input.nonce,
            timestamp: BigInt(timestamp),
          },
        };

        // 验证签名
        const isValid = await verifyTypedData({
          address: input.address as `0x${string}`,
          domain: typedData.domain,
          types: typedData.types,
          primaryType: typedData.primaryType,
          message: typedData.message,
          signature: input.signature as `0x${string}`,
        });

        if (!isValid) {
          throw new Error("签名验证失败");
        }

        // 查找或创建用户（通过email，因为email包含钱包地址）
        let user = await ctx.db.user.findFirst({
          where: {
            walletAddress: input.address.toLowerCase(),
          },
        });

        if (!user) {
          user = await ctx.db.user.create({
            data: {
              walletAddress: input.address.toLowerCase(),
            },
          });
          NotificationService.createNotification({
            title: "欢迎加入 HappyPods",
            type: NotificationType.GENERAL,
            senderId: user.id,
            receiverId: user.id,
            content: "欢迎加入 HappyPods，我们致力于为开发者提供一个公平、公正、透明的社区，让开发者能够更好地申请Grants!",
          });
        }

        // 生成JWT token
        const token = generateToken({
          userId: user.id,
          address: input.address.toLowerCase(),
        });

        return {
          success: true,
          token,
        };
      } catch (error) {
        console.error('Signature verification error:', error);
        throw new Error(error instanceof Error ? error.message : "签名验证失败");
      }
    }),

  // 验证JWT token（可选，用于检查登录状态）
  validateToken: publicProcedure
    .input(validateTokenSchema)
    .query(async ({ ctx, input }) => {
      const payload = verifyToken(input.token);
      if (!payload) {
        throw new Error("无效的token");
      }

      const user = await ctx.db.user.findUnique({
        where: { id: payload.userId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          metadata: true,
        },
      });

      if (!user) {
        throw new Error("用户不存在");
      }

      return {
        valid: true,
        user: {
          ...user,
          address: payload.address,
        },
      };
    }),
}); 