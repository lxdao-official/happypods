import { z } from "zod";

export const submitMilestoneDeliverySchema = z.object({
  milestoneId: z.number(),
  content: z.string().min(1, "content is required").max(8000),
  links: z.record(z.string()).optional(),
  transactionHash: z.string()
});

export const reviewMilestoneDeliverySchema = z.object({
  milestoneId: z.number(),
  approved: z.boolean(),
  comment: z.string().max(8000).optional(),
  safeTransactionHash: z.string().optional(),
});

export const initiatePodRefundSchema = z.object({
  podId: z.number(),
});