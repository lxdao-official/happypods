import { z } from "zod";

export const submitMilestoneDeliverySchema = z.object({
  milestoneId: z.number(),
  content: z.string().min(1, "content is required").max(8000),
  links: z.record(z.string()).optional(),
  // 保持向后兼容，前端可不传；后端会自行计算 expected hash
  transactionHash: z.string().optional(),
});

export const reviewMilestoneDeliverySchema = z.object({
  milestoneId: z.number(),
  approved: z.boolean(),
  comment: z.string().max(8000).optional(),
  // 仅为了兼容旧版本，后端审核使用存储的 hash
  safeTransactionHash: z.string().optional(),
});

export const initiatePodRefundSchema = z.object({
  podId: z.number(),
});
