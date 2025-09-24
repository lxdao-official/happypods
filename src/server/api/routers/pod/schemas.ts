import { z } from "zod";

export const milestoneSchema = z.object({
  id: z.number().optional(),
  title: z.string().min(1, "milestone title is required").max(200),
  description: z.string().min(1, "milestone description is required").max(8000),
  amount: z.number().min(0, "milestone amount is required"),
  deadline: z.string().min(1, "milestone deadline is required"),
});

export const createPodSchema = z.object({
  grantsPoolId: z.number(),
  rfpId: z.number(),
  walletAddress: z.string().min(1, "wallet address is required"),
  avatar: z.string().url().max(255).optional(),
  title: z.string().min(1, "title is required").max(200),
  description: z.string().min(1, "description is required").max(8000),
  links: z.any().optional(),
  currency: z.string().min(1, "currency is required").max(10),
  tags: z.string().optional(),
  milestones: z.array(milestoneSchema).min(1, "at least one milestone is required"),
  isCheck: z.boolean().optional(),
});

export const updatePodSchema = z.object({
  id: z.number(),
  avatar: z.string().url().max(255).optional(),
  title: z.string().min(1, "title is required").max(200).optional(),
  description: z.string().min(1, "description is required").max(8000).optional(),
  links: z.any().optional(),
  currency: z.string().min(1, "currency is required").max(10).optional(),
  tags: z.string().optional(),
  status: z.enum(["REVIEWING", "APPROVED", "REJECTED", "IN_PROGRESS", "COMPLETED", "TERMINATED"]).optional(),
});

export const getListSchema = z.object({
  limit: z.number().min(1).max(200).default(20),
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
  rejectReason: z.string().min(1, "reject reason is required").max(8000)
});

export const approvePodSchema = z.object({
  id: z.number(),
  transactionHash: z.string().optional(),
});

export const editPodSchema = z.object({
  id: z.number(),
  avatar: z.string().url().max(255).optional(),
  title: z.string().min(1, "title is required ").max(200),
  description: z.string().min(1, "description is required").max(8000),
  links: z.any().optional(),
  tags: z.string().optional(),
  milestones: z.array(milestoneSchema),
});

 