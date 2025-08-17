import { z } from "zod";

// 定义用户输入校验 schema
export const createUserSchema = z.object({
  walletAddress: z.string().min(1, "钱包地址不能为空"),
  avatar: z.string().url().max(255).optional(),
  name: z.string().min(1, "用户名称不能为空").max(100).optional(),
  email: z.string().email("请输入有效的邮箱地址").max(100).optional(),
  role: z.enum(["ADMIN", "GP_MOD", "APPLICANT", "VIEWER"]).optional(),
  description: z.string().max(1000).optional(),
  links: z.record(z.string()).optional(), // 存储多个链接
});

export const updateUserSchema = createUserSchema.partial().extend({
  id: z.number(),
});

export const getAllSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
  search: z.string().optional(),
  role: z.enum(["ADMIN", "GP_MOD", "APPLICANT", "VIEWER"]).optional(),
});

export const checkEmailExistsSchema = z.object({ 
  email: z.string().email(), 
  excludeId: z.number().optional() 
}); 