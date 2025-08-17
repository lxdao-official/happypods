import { z } from "zod";

export const submitMilestoneDeliverySchema = z.object({
  milestoneId: z.number(),
  content: z.string().min(1, "内容不能为空").max(1000),
  links: z.record(z.string()).optional(),
  transactionHash: z.string()
});

export const reviewMilestoneDeliverySchema = z.object({
  milestoneId: z.number(),
  approved: z.boolean(),
  comment: z.string().max(1000).optional(),
  safeTransactionHash: z.string().optional(),
});

export const initiatePodRefundSchema = z.object({
  podId: z.number(),
});