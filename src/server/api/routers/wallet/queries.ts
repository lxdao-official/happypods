import { createPublicClient, http, erc20Abi, formatUnits } from "viem";
import { publicProcedure } from "../../trpc";
import { CHAIN_MAP, PLATFORM_CHAINS } from "../../../../lib/config";
import { getBalanceSchema } from "./schemas";
import type { ChainType } from "@prisma/client";

export const getBalance = async (input: {
  address: string;
  chainType: ChainType;
  tokenType: string;
}) => {
  const { address, chainType, tokenType } = input;
  const defaultBalance = {
    rawBalance: 0n,
    formattedBalance: 0,
    decimals: 18,
    tokenType,
    address,
  };
  try {
    const chainConfig = PLATFORM_CHAINS[CHAIN_MAP[chainType].id];
    if (!chainConfig) {
      return defaultBalance;
    }

    const token =
      chainConfig.TOKENS[tokenType as keyof typeof chainConfig.TOKENS];
    const chain = CHAIN_MAP[chainType];

    const client = createPublicClient({
      chain,
      transport: http(chainConfig.RPCS[0]),
    });

    const rawBalance = await client.readContract({
      address: token.address,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [address as `0x${string}`],
    });

    const formattedBalance = formatUnits(rawBalance, token.decimals);

    return {
      rawBalance: rawBalance || 0n,
      formattedBalance: formattedBalance || 0,
      decimals: token.decimals,
      tokenType,
      address,
    };
  } catch (error) {
    return defaultBalance;
  }
};

export const walletQueries = {
  getBalance: publicProcedure
    .input(getBalanceSchema)
    .query(async ({ input }) => {
      return await getBalance(input);
    }),
};
