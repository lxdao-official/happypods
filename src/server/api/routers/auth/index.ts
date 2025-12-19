import { randomUUID } from "crypto";
import { verifyTypedData } from "viem";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { verifySignatureSchema, validateTokenSchema } from "./schemas";
import { NotificationService } from "../notification/notification-service";
import { NotificationType } from "@prisma/client";
import { generateToken, verifyToken } from "~/lib/jwt";

// 定义TypedData结构
const domain = {
  name: 'HappyPods',
  version: '1',
} as const;

const types = {
  LoginMessage: [
    { name: 'message', type: 'string' },
    { name: 'nonce', type: 'string' },
    { name: 'timestamp', type: 'uint256' },
  ],
} as const;

// 简单的内存 nonce 存储，包含过期时间
const NONCE_TTL_MS = 10 * 60 * 1000; // 10 分钟
const CLEANUP_INTERVAL_MS = 10 * 60 * 1000; // 10 分钟清理一次
const nonceStore = new Map<string, number>(); // nonce -> expiresAt

function createNonce() {
  const nonce = randomUUID();
  const expiresAt = Date.now() + NONCE_TTL_MS;
  nonceStore.set(nonce, expiresAt);
  return { nonce, expiresAt };
}

function consumeNonce(nonce: string) {
  const expiresAt = nonceStore.get(nonce);
  if (!expiresAt) {
    throw new Error("Nonce not found or expired, please request a new one");
  }
  if (Date.now() > expiresAt) {
    nonceStore.delete(nonce);
    throw new Error("Nonce expired, please request a new one");
  }
  nonceStore.delete(nonce);
  return true;
}

// 周期性清理过期 nonce，避免内存堆积
setInterval(() => {
  const now = Date.now();
  for (const [nonce, expiresAt] of nonceStore.entries()) {
    if (expiresAt <= now) {
      nonceStore.delete(nonce);
    }
  }
}, CLEANUP_INTERVAL_MS).unref();

export const authRouter = createTRPCRouter({
  // 请求登录 nonce
  getNonce: publicProcedure.query(() => {
    return createNonce();
  }),

  // 验证签名并生成JWT token
  verifySignature: publicProcedure
    .input(verifySignatureSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const currentTime = Math.floor(Date.now() / 1000);
        
        // 检查签名是否过期（5分钟内有效）
        if (currentTime - input.timestamp > 300) {
          throw new Error("Signature expired, please sign again");
        }

        // 确认 nonce 存在且未过期，并在使用后移除，防止重放
        consumeNonce(input.nonce);

        // 构造TypedData
        const typedData = {
          domain,
          types,
          primaryType: 'LoginMessage' as const,
          message: {
            message: input.message,
            nonce: input.nonce,
            timestamp: BigInt(input.timestamp),
          },
        };

        const isValid = await verifyTypedData({
          address: input.address as `0x${string}`,
          domain: typedData.domain,
          types: typedData.types,
          primaryType: typedData.primaryType,
          message: typedData.message,
          signature: input.signature as `0x${string}`,
        });

        console.log('Signature verification result:', isValid);

        if (!isValid) {
          throw new Error("Signature verification failed");
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
            title: "Welcome to HappyPods",
            type: NotificationType.GENERAL,
            senderId: user.id,
            receiverId: user.id,
            content: "Welcome to HappyPods, we are committed to providing a fair, transparent, and open community for developers, enabling them to apply for Grants more effectively!", 
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
        throw new Error(error instanceof Error ? error.message : "Signature verification failed");
      }
    }),

  // 验证JWT token（可选，用于检查登录状态）
  validateToken: publicProcedure
    .input(validateTokenSchema)
    .query(async ({ ctx, input }) => {
      const payload = verifyToken(input.token);
      if (!payload) {
        throw new Error("Invalid token");
      }

      const user = await ctx.db.user.findUnique({
        where: { id: payload.userId },
        select: {
          id: true,
          name: true,
          email: true,
          metadata: true,
        },
      });

      if (!user) {
        throw new Error("User not found");
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
