import { ChainType } from "@prisma/client";
import { z } from "zod";

export const getBalanceSchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "无效的钱包地址"),
  chainType: z.nativeEnum(ChainType),
  tokenType: z.enum(["USDC", "USDT"]),
});

export type GetBalanceInput = z.infer<typeof getBalanceSchema>;
