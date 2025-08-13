import { useAccount, useWalletClient, usePublicClient, useChainId, useSwitchChain, useSendTransaction } from "wagmi";
import { useEffect, useMemo, useState, useCallback } from "react";
import Safe, { type SafeAccountConfig, type PredictedSafeProps } from '@safe-global/protocol-kit';
import SafeApiKit from '@safe-global/api-kit';
import type { SafeTransaction, MetaTransactionData } from '@safe-global/types-kit';
import { keccak256, encodeFunctionData, type Address, erc20Abi } from "viem";
import { toast } from "sonner";
import { PLATFORM_CHAINS } from "~/lib/config";
import type { GrantsPoolTokens } from "@prisma/client";

const useSafeWallet = () => {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const chainId = useChainId();
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const { status: sendTransactionStatus, sendTransactionAsync } = useSendTransaction();

  const apiKit = useMemo(() => {
    return new SafeApiKit({
      chainId: BigInt(chainId),
      apiKey: process.env.NEXT_PUBLIC_SAFE_API_KEY
    })
  }, [chainId]);

  useEffect(() => {
    if (sendTransactionStatus === 'error') {
      toast.error('多签钱包未创建！');
      setStatus('idle');
    }
    if (sendTransactionStatus === 'success') {
      setStatus('success');
    }
  }, [sendTransactionStatus]);

  // 通用的钱包连接检查
  const validateWalletConnection = useCallback(() => {
    if (!address || !walletClient || !publicClient) {
      throw new Error("请先连接钱包");
    }
  }, [address, walletClient, publicClient]);

  // 通用的Safe实例初始化
  const initSafeInstance = useCallback(async (safeAddress: string) => {
    validateWalletConnection();
    return await Safe.init({
      provider: walletClient as any,
      safeAddress
    });
  }, [walletClient, validateWalletConnection]);

  // 通用的错误处理包装器
  const withErrorHandling = useCallback(async <T,>(
    operation: () => Promise<T>,
    errorMessage: string,
    setLoading: boolean = true
  ): Promise<T> => {
    try {
      if (setLoading) setStatus('loading');
      const result = await operation();
      if (setLoading) setStatus('success');
      return result;
    } catch (error) {
      console.error(`${errorMessage} error =>`, error);
      setStatus('error');
      toast.error(errorMessage);
      throw error;
    }
  }, []);

  // 部署多签钱包合约
  const deploySafe = async (owners: string[] = [], threshold: number = 1) => {
    return withErrorHandling(async () => {
      validateWalletConnection();
      console.log('owners==>', owners, threshold);
      
      // 配置 Safe 账户
      const safeAccountConfig: SafeAccountConfig = {
        owners: [...owners],
        threshold: threshold
      };

      const customString = `safe-deploy-${Date.now()}`;
      const saltNonceHash = keccak256(Buffer.from(customString));
      console.log('saltNonce==>', saltNonceHash);

      const predictedSafe: PredictedSafeProps = {
        safeAccountConfig,
        safeDeploymentConfig: {
          saltNonce: saltNonceHash
        }
      };

      // 初始化 Protocol Kit
      const protocolKit = await Safe.init({
        provider: walletClient as any,
        predictedSafe
      });

      // 预测 Safe 地址
      const safeAddress = await protocolKit.getAddress();
      console.log('safeAddress==>', safeAddress);
      
      // 创建部署交易
      try {
        const deploymentTransaction = await protocolKit.createSafeDeploymentTransaction();
        await sendTransactionAsync({
          to: deploymentTransaction.to,
          value: BigInt(deploymentTransaction.value),
          data: deploymentTransaction.data as `0x${string}`
        });
      } catch (error) {
        console.log('error===>', error);
        toast.error('创建Safe多签钱包失败或已存在，请重试！');
        throw error;
      }
      
      return { safeAddress };
    }, '创建Safe多签钱包失败');
  };

  // 创建并计算哈希多签交易：传入已构建的 SafeTransaction，返回 safeTxHash
  const getTransactionHash = async (safeAddress: string, safeTransaction: SafeTransaction, signPropose: boolean = false) => {
    return withErrorHandling(async () => {
      const safeWallet = await initSafeInstance(safeAddress);
      const safeTxHash = await safeWallet.getTransactionHash(safeTransaction);

      if (signPropose) {
        const senderSignature = await safeWallet.signHash(safeTxHash);
        await apiKit.proposeTransaction({
          safeAddress,
          safeTransactionData: safeTransaction.data,
          safeTxHash,
          senderAddress: address!,
          senderSignature: senderSignature.data
        });
      }

      return safeTxHash;
    }, '发送多签交易失败');
  };

  // 获取待处理交易列表（多签未执行/未完成）
  const getPendingTransactions = async (safeAddress: string) => {
    return withErrorHandling(async () => {
      if (!chainId) {
        throw new Error('无法获取网络 ID');
      }
      const pending = await apiKit.getPendingTransactions(safeAddress);
      return pending;
    }, '获取待处理交易失败', false);
  };

  // 对 SafeTransaction 进行签名
  const signSafeTransaction = async (safeAddress: string, safeTransaction: SafeTransaction) => {
    return withErrorHandling(async () => {
      const safeWallet = await initSafeInstance(safeAddress);
      await safeWallet.signTransaction(safeTransaction);
      return true;
    }, '签名交易失败');
  };

  // 执行已签名完成的 SafeTransaction
  const executeSafeTransaction = async (safeAddress: string, safeTransaction: SafeTransaction) => {
    return withErrorHandling(async () => {
      const safeWallet = await initSafeInstance(safeAddress);
      
      const execResponse = await safeWallet.executeTransaction(safeTransaction);
      const txHash = ((execResponse as any).transactionResponse?.hash || (execResponse as any).hash) as
        | `0x${string}`
        | undefined;

      let receipt: unknown = undefined;
      if (txHash) {
        receipt = await publicClient!.waitForTransactionReceipt({ hash: txHash });
      }

      return { txHash, receipt };
    }, '执行交易失败');
  };

  // 根据当前的交易hash获取交易对象,并完成转账执行
  const executeSafeTransactionByHash = async (safeAddress: string, safeTransactionHash: string) => {
    return withErrorHandling(async () => {
      const safeWallet = await initSafeInstance(safeAddress);
      const safeTransaction = await apiKit.getTransaction(safeTransactionHash);
      return await safeWallet.executeTransaction(safeTransaction);
    }, '执行交易失败', false);
  };

  // 基于 {token, from, to, amount}[] 构建 ERC20 转账 SafeTransaction
  type TransferInput = Readonly<{
    token: GrantsPoolTokens;
    from?: string; // 可选，若提供则校验与 safeAddress 一致
    to: string;
    amount: string; // 推荐字符串，便于按 decimals 精确转换
  }>;

  const buildErc20TransfersSafeTransaction = async (
    safeAddress: string,
    transfers: ReadonlyArray<TransferInput>
  ): Promise<SafeTransaction> => {
    return withErrorHandling(async () => {
      validateWalletConnection();
      
      if (!chainId) {
        throw new Error('请先连接钱包');
      }

      const chainConfig = PLATFORM_CHAINS[chainId];
      if (!chainConfig) {
        throw new Error(`当前网络(${chainId})未在 PLATFORM_CHAINS 中配置`);
      }

      // 校验 from 一致性（若提供）
      for (const t of transfers) {
        if (t.from && t.from.toLowerCase() !== safeAddress.toLowerCase()) {
          throw new Error('转账项中的 from 必须为当前 Safe 地址');
        }
      }

      const txs: MetaTransactionData[] = transfers.map((t) => {
        const tokenKey = t.token.toUpperCase() as 'USDC' | 'USDT';
        const tokenInfo = chainConfig.TOKENS[tokenKey];
        if (!tokenInfo) {
          throw new Error(`未配置代币: ${t.token}`);
        }
        const tokenAddress = tokenInfo.address as Address;

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

      const safeWallet = await initSafeInstance(safeAddress);
      return await safeWallet.createTransaction({ transactions: txs });
    }, '构建ERC20转账交易失败');
  };

  // 传入交易数据,构建交易获取hash,发起交易
  const buildAndExecuteSafeTransaction = async (safeAddress: string, transfers: ReadonlyArray<TransferInput>) => {
    return withErrorHandling(async () => {
      console.log('transfers==>', transfers);
      const safeTransaction = await buildErc20TransfersSafeTransaction(safeAddress, transfers);
      console.log('safeTransaction==>', safeTransaction);
      const safeTxHash = await getTransactionHash(safeAddress, safeTransaction, true);
      console.log('safeTxHash==>', safeTxHash);
      const res = await executeSafeTransactionByHash(safeAddress, safeTxHash);
      return {
        res,
        safeTxHash
      };
    }, '构建并执行Safe交易失败', false);
  };

  // 获取交易详情
  const getTransactionDetail = async (safeTransactionHash: string) => {
    return withErrorHandling(async () => {
      return await apiKit.getTransaction(safeTransactionHash);
    }, '获取交易详情失败', false);
  };

  return {
    deploySafe,
    getTransactionHash,
    getPendingTransactions,
    signSafeTransaction,
    executeSafeTransaction,
    buildErc20TransfersSafeTransaction,
    executeSafeTransactionByHash,
    buildAndExecuteSafeTransaction,
    getTransactionDetail,
    status
  };
};

export default useSafeWallet;