import { z } from "zod";

export const rfpSchema = z.object({
  title: z.string().min(1, "RFP标题不能为空"),
  description: z.string().min(1, "RFP描述不能为空"),
  metadata: z.any().optional(),
});

export const createGrantsPoolSchema = z.object({
  avatar: z.string().url().optional(),
  name: z.string().min(1, "GP名称不能为空"),
  description: z.string().min(1, "GP描述不能为空"),
  links: z.record(z.string()).optional(),
  tags: z.string().optional(),
  rfps: z.array(rfpSchema),
  modInfo: z.any(),
  treasuryWallet: z.string().min(1, "国库钱包地址不能为空"),
  chainType: z.enum(["ETHEREUM", "OPTIMISM"]),
  treasuryBalances: z.any().optional(),
});

// 更新时的 RFP schema，支持现有和新增的 RFP
export const updateRfpSchema = z.object({
  id: z.number().optional(), // 现有 RFP 有 ID，新增的没有
  title: z.string().min(1, "RFP标题不能为空"),
  description: z.string().min(1, "RFP描述不能为空"),
});

export const updateGrantsPoolSchema = z.object({
  id: z.number(),
  avatar: z.string().url().optional(),
  name: z.string().min(1, "GP名称不能为空").optional(),
  description: z.string().min(1, "GP描述不能为空").optional(),
  links: z.record(z.string()).optional(),
  tags: z.string().optional(),
  rfps: z.array(updateRfpSchema).optional(),
  modInfo: z.any().optional(),
  treasuryWallet: z.string().min(1, "国库钱包地址不能为空").optional(),
  chainType: z.enum(["ETHEREUM", "OPTIMISM"]).optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]).optional(),
  treasuryBalances: z.any().optional(),
});

export const getAllSchema = z.object({
  limit: z.number().min(1).max(100).default(50),
  cursor: z.number().nullish(),
  search: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]).optional(),
  chainType: z.enum(["ETHEREUM", "OPTIMISM"]).optional(),
}).optional(); 