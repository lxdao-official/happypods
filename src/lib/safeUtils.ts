import { encodeFunctionData, erc20Abi, formatUnits, type Address } from "viem";
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { GrantsPoolTokens } from "@prisma/client";
import type { MetaTransactionData, SafeTransaction } from "@safe-global/types-kit";
import Safe from "@safe-global/protocol-kit";
import { PLATFORM_CHAINS } from "./config";
import { optimism } from "viem/chains";



// 判断是否是多签钱包，并且存在当前账户是签名者， 阈值设置是否符合预期
export const isUserInMultiSigWallet = async(
    address: string, 
    walletAddress: string[], 
    threshold:number = 1, 
    strictMatch: boolean = false
  ) => {
    const wallet = await PLATFORM_CHAINS[optimism.id]?.safeApiKit.getSafeInfo(address);
    if(!wallet || !walletAddress) return false;
    walletAddress = walletAddress.map(address => address.toLocaleLowerCase());
    
    if (strictMatch) {
      // 严格比对：地址和threshold必须完全一致
      const walletOwners = wallet.owners.map(owner => owner.toLocaleLowerCase());
      const hasAllAddresses = walletAddress.every(addr => walletOwners.includes(addr));
      const hasExactThreshold = wallet.threshold === threshold;
      return hasAllAddresses && hasExactThreshold;
    } else {
      // 原有逻辑：包含关系
      return wallet.owners.some(owner => walletAddress.includes(owner.toLocaleLowerCase())) && wallet.threshold >= threshold;
    }
  }
  

  
  
// 构建ERC20转账交易
// 基于 {token, from, to, amount}[] 构建 ERC20 转账 SafeTransaction
export type TransferInput = Readonly<{
    token: GrantsPoolTokens;
    from?: string; // 可选，若提供则校验与 safeAddress 一致
    to: string;
    amount: string; // 推荐字符串，便于按 decimals 精确转换
  }>;
  
  export const buildErc20TransfersSafeTransaction = async (
    safeAddress: string,
    transfers: ReadonlyArray<TransferInput>
  ): Promise<SafeTransaction> => {
    const chainConfig = PLATFORM_CHAINS[optimism.id];
    if (!chainConfig) {
      throw new Error(`current network is not in PLATFORM_CHAINS`);
    }
  
    // 校验 from 一致性（若提供）
    for (const t of transfers) {
      if (t.from && t.from.toLowerCase() !== safeAddress.toLowerCase()) {
        throw new Error('from must be the current Safe address');
      }
    }
  
    const txs: MetaTransactionData[] = transfers.map((t) => {
      const tokenKey = t.token.toUpperCase() as 'USDC' | 'USDT';
      const tokenInfo = chainConfig.TOKENS[tokenKey];
      if (!tokenInfo) {
        throw new Error(`not found token: ${t.token}`);
      }
      const tokenAddress = tokenInfo.address;
  
      const value = BigInt(t.amount);
      const data = encodeFunctionData({
        abi: erc20Abi,
        functionName: 'transfer',
        args: [t.to, value] as [Address, bigint],
      });
  
      return {
        to: tokenAddress,
        value: '0',
        data,
        operation: 0,
      } satisfies MetaTransactionData;
    });
  
    const safeWallet = await Safe.init({
      provider: PLATFORM_CHAINS[optimism.id]?.RPCS[0] as any,
      safeAddress
    });
    const res = await safeWallet.createTransaction({ transactions: txs });
    const hash = await safeWallet.getTransactionHash(res);
    console.log(hash);
    return res as SafeTransaction;
  };

//  构建并获取 hash
  export const buildErc20SafeTransactionAndHash = async (
    safeAddress: string,
    transfers: ReadonlyArray<TransferInput>
  ) => {
    const safeWallet = await Safe.init({
        provider: PLATFORM_CHAINS[optimism.id]?.RPCS[0] as any,
        safeAddress
    });
    const transactions = await buildErc20TransfersSafeTransaction(safeAddress, transfers);
    const hash = await safeWallet.getTransactionHash(transactions);
    return { transactions, hash };
  }

  // 获取当前safe钱包有哪些 owners
  export const getSafeWalletOwners = async (safeAddress: string) => {
    const safeWallet = await Safe.init({
      provider: PLATFORM_CHAINS[optimism.id]?.RPCS[0] as any,
      safeAddress
    });
    const owners = await safeWallet.getOwners();
    return owners;
  }