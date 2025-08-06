import { z } from "zod";

export const submitMilestoneDeliverySchema = z.object({
  milestoneId: z.number(),
  content: z.string().min(1, "内容不能为空"),
  links: z.record(z.string()).optional(),
});

export const reviewMilestoneDeliverySchema = z.object({
  milestoneId: z.number(),
  deliveryIndex: z.number(),
  approved: z.boolean(),
  comment: z.string().optional(),
});

export const confirmPaymentSchema = z.object({
  milestoneId: z.number(),
});