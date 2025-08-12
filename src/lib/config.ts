/**
 * 全局配置文件
 */

import type { Address } from "viem";
import { mainnet, optimism, type Chain } from "viem/chains";
import { ChainType } from "@prisma/client";
import SafeApiKit from "@safe-global/api-kit";

// 手续费相关配置
export const FEE_CONFIG = {
  // 手续费率 (10%)
  TRANSACTION_FEE_RATE: 0.01,
  // 最小手续费 (以防总额太小)
  MIN_TRANSACTION_FEE: 0,
} as const;

export type Status =
  | "IN_PROGRESS"
  | "COMPLETED"
  | "REJECTED"
  | "WAITLISTED"
  | "SUBMITTED"
  | "APPROVED"
  | "REVIEWING"
  | "TERMINATED"
  | "PENDING_DELIVERY"
  | "ACTIVE"
  | "INACTIVE"
  | "PENDING_PAYMENT";

// @ts-ignore
export const STATUS_MAP: Record<Status, { label: string; color: string }> = {
  // Pod 状态
  REVIEWING: { label: "Reviewing", color: "#FFA500" },
  APPROVED: { label: "Approved", color: "#008000" },
  REJECTED: { label: "Rejected", color: "#FF0000" },
  IN_PROGRESS: { label: "In Progress", color: "#008000" },
  COMPLETED: { label: "Completed", color: "#008000" },
  TERMINATED: { label: "Terminated", color: "#FF0000" },
  ACTIVE: { label: "Active", color: "#315ece" },
  INACTIVE: { label: "Inactive", color: "#FFA500" },
  PENDING_DELIVERY: { label: "Delivery Pending", color: "#FF6B35" },
  PENDING_PAYMENT: { label: "Payment Pending", color: "#7435ff" },
};

// 其他配置
export const APP_CONFIG = {
  // 默认分页大小
  DEFAULT_PAGE_SIZE: 20,
  // 最大分页大小
  MAX_PAGE_SIZE: 100,
} as const;

// 平台国库地址
export const PLATFORM_TREASURY_ADDRESS = "0x115a788c09f204ffde5a0f95eb53b2711f0a64fd";

// 平台管理员地址
export const PLATFORM_MOD_ADDRESS = "0x2627b9f8f75dbc2870232715520ffaa24248bc76";

export type Token = {
  address: Address;
  decimals: number;
}
// 各平台的TOKEN地址
export const PLATFORM_CHAINS:Record<Chain['id'], {TOKENS: {USDC: Token, USDT: Token}, START_BLOCK_NUMBER: bigint, RPCS: string[], safeApiKit: SafeApiKit}> = {
  [optimism.id]: {
    TOKENS: {
      USDC: {
        address: "0x0b2c639c533813f4aa9d7837caf62653d097ff85",
        decimals: 6,
      },
      USDT: {
        address: "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58",
        decimals: 6,
      },
    },
    START_BLOCK_NUMBER: 139468091n,
    RPCS:['https://optimism-mainnet.infura.io/v3/839d5d4b452f4408a1f763fd5c42af1c'],
    safeApiKit: new SafeApiKit({
      chainId: BigInt(optimism.id),
      apiKey: process.env.NEXT_PUBLIC_SAFE_API_KEY
    }),
  },
  [mainnet.id]: {
    TOKENS: {
      USDC: {
        address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
        decimals: 6,
      },
      USDT: {
        address: "0xdac17f958d2ee523a2206206994597c13d831ec7",
        decimals: 6,
      },
    },
    START_BLOCK_NUMBER: 23086332n,
    RPCS:['https://mainnet.infura.io/v3/839d5d4b452f4408a1f763fd5c42af1c'],
    safeApiKit: new SafeApiKit({
      chainId: BigInt(mainnet.id),
      apiKey: process.env.NEXT_PUBLIC_SAFE_API_KEY
    }),
  },
};

// ChainType 到 Chain 的映射
export const CHAIN_MAP: Record<ChainType, Chain> = {
  [ChainType.ETHEREUM]: mainnet,
  [ChainType.OPTIMISM]: optimism,
};


// 默认可用的标签列表
export const DEFAULT_TAGS = [
  "DeFi", "NFT", "GameFi", "Infrastructure", "DAO", "Privacy", 
  "Scalability", "Interoperability", "AI/ML", "Social Impact",
  "Education", "Healthcare", "Finance", "Gaming", "Art", "Music",
  "Environment", "Governance", "Security", "Analytics"
];