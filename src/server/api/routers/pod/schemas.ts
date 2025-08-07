import { z } from "zod";

export const milestoneSchema = z.object({
  title: z.string().min(1, "里程碑标题不能为空"),
  description: z.string().min(1, "里程碑描述不能为空"),
  amount: z.number().min(0, "金额必须大于等于0"),
  deadline: z.string().min(1, "截止日期不能为空"),
});

export const createPodSchema = z.object({
  grantsPoolId: z.number(),
  rfpId: z.number(),
  walletAddress: z.string().min(1, "钱包地址不能为空"),
  avatar: z.string().url().optional(),
  title: z.string().min(1, "项目标题不能为空"),
  description: z.string().min(1, "项目描述不能为空"),
  links: z.any().optional(),
  currency: z.string().min(1, "币种不能为空"),
  tags: z.string().optional(),
  milestones: z.array(milestoneSchema).min(1, "至少需要一个里程碑"),
  isCheck: z.boolean().optional(),
});

export const updatePodSchema = z.object({
  id: z.number(),
  avatar: z.string().url().optional(),
  title: z.string().min(1, "项目标题不能为空").optional(),
  description: z.string().min(1, "项目描述不能为空").optional(),
  links: z.any().optional(),
  currency: z.string().min(1, "币种不能为空").optional(),
  tags: z.string().optional(),
  status: z.enum(["REVIEWING", "APPROVED", "REJECTED", "IN_PROGRESS", "COMPLETED", "TERMINATED"]).optional(),
});

export const getListSchema = z.object({
  limit: z.number().min(1).max(100).default(20),
  cursor: z.number().nullish(),
  search: z.string().optional(),
  status: z.enum(["REVIEWING", "APPROVED", "REJECTED", "IN_PROGRESS", "COMPLETED", "TERMINATED"]).optional(),
  grantsPoolId: z.number().optional(),
  myOnly: z.boolean().optional(),
});

export const validateMilestonesSchema = z.object({
  grantsPoolId: z.number(),
  currency: z.string(),
  milestones: z.array(milestoneSchema),
});

export const rejectPodSchema = z.object({
  id: z.number(),
  rejectReason: z.string().min(1, "拒绝理由不能为空"),
});

export const approvePodSchema = z.object({
  id: z.number(),
});

 