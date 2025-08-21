import { z } from "zod";

export const rfpSchema = z.object({
  title: z.string().min(1, "RFP title is required").max(100),
  description: z.string().min(1, "RFP description is required").max(1000),
  metadata: z.any().optional(),
});

export const createGrantsPoolSchema = z.object({
  avatar: z.string().url().max(255).optional(),
  name: z.string().min(1, "GP name is required").max(100),
  description: z.string().min(1, "GP description is required").max(1000),
  links: z.record(z.string()).optional(),
  tags: z.string().optional(),
  rfps: z.array(rfpSchema),
  modInfo: z.any(),
  treasuryWallet: z.string().min(1, "treasury wallet address is required"),
  chainType: z.enum(["ETHEREUM", "OPTIMISM"]),
});

// 更新时的 RFP schema，支持现有和新增的 RFP
export const updateRfpSchema = z.object({
  id: z.number().optional(), // 现有 RFP 有 ID，新增的没有
  title: z.string().min(1, "RFP title is required").max(100),
  description: z.string().min(1, "RFP description is required").max(1000),
});

export const updateGrantsPoolSchema = z.object({
  id: z.number(),
  avatar: z.string().url().max(255).optional(),
  name: z.string().min(1, "GP name is required").max(100).optional(),
  description: z.string().min(1, "GP description is required").max(1000).optional(),
  links: z.record(z.string()).optional(),
  tags: z.string().optional(),
  rfps: z.array(updateRfpSchema).optional(),
  modInfo: z.any().optional(),
  treasuryWallet: z.string().min(1, "treasury wallet address is required").optional(),
  chainType: z.enum(["ETHEREUM", "OPTIMISM"]).optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]).optional(),
});

export const getAllSchema = z.object({
  limit: z.number().min(1).max(100).default(50),
  cursor: z.number().nullish(),
  search: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]).optional(),
  chainType: z.enum(["ETHEREUM", "OPTIMISM"]).optional(),
}).optional(); 