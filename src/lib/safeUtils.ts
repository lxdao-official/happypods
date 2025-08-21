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
    console.log('验证信息===>');
    
    const maxRetries = 5;
    const retryDelay = 3000;
    
    let wallet = null;
    let lastError = null;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        wallet = await PLATFORM_CHAINS[optimism.id]?.safeApiKit.getSafeInfo(address);
        break; // 成功则跳出循环
      } catch (error) {
        lastError = error;
        console.warn(`获取Safe信息失败，第 ${attempt + 1} 次尝试:`, error);
        
        if (attempt < maxRetries - 1) {
          console.log(`等待 ${retryDelay}ms 后重试...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    }
    
    if (!wallet) {
      console.error(`获取Safe信息失败，已重试 ${maxRetries} 次:`, lastError);
      return false;
    }

    console.log({
      address, 
      walletAddress, 
      threshold, 
      strictMatch,
      wallet
    });
    

    if(!walletAddress || !threshold) return false;
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
  

// 带重试机制的 getTransaction 方法
export const getSafeTransactionWithRetry = async (
  safeTransactionHash: string,
  maxRetries: number = 5,
  retryDelay: number = 3000
) => {
  let lastError = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const safeTransaction = await PLATFORM_CHAINS[optimism.id]?.safeApiKit.getTransaction(safeTransactionHash);
      return safeTransaction;
    } catch (error) {
      lastError = error;
      console.warn(`获取Safe交易失败，第 ${attempt + 1} 次尝试:`, error);
      
      if (attempt < maxRetries - 1) {
        console.log(`等待 ${retryDelay}ms 后重试...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }
  
  console.error(`获取Safe交易失败，已重试 ${maxRetries} 次:`, lastError);
  throw lastError;
};

  
  
// 构建ERC20转账交易
// 基于 {token, from, to, amount}[] 构建 ERC20 转账 SafeTransaction
export type TransferInput = Readonly<{
    token: GrantsPoolTokens;
    to: string;
    amount: string; // 推荐字符串，便于按 decimals 精确转换
  }>;
  
  export const buildErc20TransfersSafeTransaction = async (
    safeAddress: string,
    transfers: TransferInput[]
  ): Promise<SafeTransaction> => {
    const chainConfig = PLATFORM_CHAINS[optimism.id];
    if (!chainConfig) {
      throw new Error(`current network is not in PLATFORM_CHAINS`);
    }

    const transfersSorted = transfers.sort((a,b)=>a.to.localeCompare(b.to));

    console.log('transfersSorted==>',transfersSorted);
  
    const txs: MetaTransactionData[] = transfersSorted.map((t) => {
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
    transfers: TransferInput[]
  ) => {
    console.log('safeAddress===>',safeAddress);
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