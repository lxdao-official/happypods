import { z } from "zod";

// 定义签名验证的Schema
export const verifySignatureSchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "invalid ethereum address"),
  signature: z.string(),
  message: z.string(),
  timestamp: z.number(),
});

export const validateTokenSchema = z.object({ 
  token: z.string() 
}); 