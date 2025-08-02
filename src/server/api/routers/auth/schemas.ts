import { z } from "zod";

// 定义签名验证的Schema
export const verifySignatureSchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "无效的以太坊地址"),
  signature: z.string(),
  message: z.string(),
  nonce: z.string(),
});

export const validateTokenSchema = z.object({ 
  token: z.string() 
}); 