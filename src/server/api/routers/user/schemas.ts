import { z } from "zod";

// 定义用户输入校验 schema
export const createUserSchema = z.object({
  walletAddress: z.string().min(1, "wallet address is required"),
  avatar: z.string().url().max(255).optional(),
  name: z.string().min(1, "name is required").max(200).optional(),
  email: z.string().email("invalid email address").max(200).optional(),
  description: z.string().max(8000).optional(),
  links: z.record(z.string()).optional(), // 存储多个链接
});

export const updateUserSchema = createUserSchema.partial().extend({
  id: z.number(),
});

export const getAllSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(200).default(10),
  search: z.string().optional(),
});

export const checkEmailExistsSchema = z.object({ 
  email: z.string().email(), 
  excludeId: z.number().optional() 
}); 