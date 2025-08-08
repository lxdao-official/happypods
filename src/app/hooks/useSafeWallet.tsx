import { useAccount, useWalletClient, usePublicClient, useChainId, useSwitchChain, useSendTransaction } from "wagmi";
import { useEffect, useState } from "react";
import Safe, { type SafeAccountConfig, type PredictedSafeProps } from '@safe-global/protocol-kit';
import SafeApiKit from '@safe-global/api-kit';
import type { SafeTransaction, MetaTransactionData } from '@safe-global/types-kit';
import { optimism } from 'viem/chains';
import { keccak256, encodeFunctionData, parseUnits, type Address, erc20Abi } from "viem";
import { toast } from "sonner";
import { PLATFORM_CHAINS } from "~/lib/config";
import type { GrantsPoolTokens } from "@prisma/client";

const useSafeWallet = () => {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const chainId = useChainId();
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const { sendTransaction,status:sendTransactionStatus } = useSendTransaction();

  useEffect(() => {
    if(sendTransactionStatus === 'error') {
      toast.error('多签钱包未创建！');
      setStatus('idle');
    }
    if (sendTransactionStatus === 'success') {
      setStatus('success');
    }
  }, [sendTransactionStatus]);

  // 部署多签钱包合约
  const deploySafe = async (owners: string[] = [], threshold: number = 1) => {
    if (!address || !walletClient || !publicClient) {
      throw new Error("请先连接钱包");
    }
    setStatus('loading');
     // 配置 Safe 账户
     const safeAccountConfig: SafeAccountConfig = {
      owners: [address, ...owners],
      threshold: threshold
    };

    
    const customString = `safe-deploy-${Date.now()}`;
    const saltNonceHash = keccak256(Buffer.from(customString)); // 哈希为十六进制
    console.log('saltNonce==>',saltNonceHash);

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
    console.log('safeAddress==>',safeAddress);
    // 创建部署交易
      try {
        const deploymentTransaction = await protocolKit.createSafeDeploymentTransaction();
        await sendTransaction({
          to: deploymentTransaction.to,
          value: BigInt(deploymentTransaction.value),
          data: deploymentTransaction.data as `0x${string}`
        });
      } catch (error) {
        console.log('error===>',error);
        toast.error('创建Safe多签钱包失败或已存在，请重试！');
        setStatus('error');
      }
    return {
      safeAddress,
      transactionHash: ''
    };
  }

  // 发送（创建并计算哈希）多签交易：传入已构建的 SafeTransaction，返回 safeTxHash
  const getTransactionHash = async (safeAddress: string, safeTransaction: SafeTransaction) => {
    if (!address || !walletClient || !publicClient) {
      throw new Error("请先连接钱包");
    }
    try {
      setStatus('loading');
      const safeWallet = await Safe.init({
        provider: walletClient as any,
        safeAddress
      });

      const safeTxHash = await safeWallet.getTransactionHash(safeTransaction);
      setStatus('success');
      return safeTxHash;
    } catch (error) {
      console.error('sendSafeTransaction error =>', error);
      setStatus('error');
      toast.error('发送多签交易失败');
      throw error;
    }
  };

  // 获取待处理交易列表（多签未执行/未完成）
  const getPendingTransactions = async (safeAddress: string) => {
    if (!chainId) {
      throw new Error('无法获取网络 ID');
    }
    try {
      const apiKit = new SafeApiKit({ chainId: BigInt(chainId) });
      const pending = await apiKit.getPendingTransactions(safeAddress);
      return pending;
    } catch (error) {
      console.error('getPendingTransactions error =>', error);
      toast.error('获取待处理交易失败');
      throw error;
    }
  };

  // 对 SafeTransaction 进行签名
  const signSafeTransaction = async (safeAddress: string, safeTransaction: SafeTransaction) => {
    if (!address || !walletClient) {
      throw new Error("请先连接钱包");
    }
    try {
      setStatus('loading');
      const safeWallet = await Safe.init({
        provider: walletClient as any,
        safeAddress
      });
      await safeWallet.signTransaction(safeTransaction);
      setStatus('success');
      return true;
    } catch (error) {
      console.error('signSafeTransaction error =>', error);
      setStatus('error');
      toast.error('签名交易失败');
      throw error;
    }
  };

  // 执行已签名完成的 SafeTransaction
  const executeSafeTransaction = async (safeAddress: string, safeTransaction: SafeTransaction) => {
    if (!address || !walletClient || !publicClient) {
      throw new Error("请先连接钱包");
    }
    try {
      setStatus('loading');
      const safeWallet = await Safe.init({
        provider: walletClient as any,
        safeAddress
      });

      const execResponse = await safeWallet.executeTransaction(safeTransaction);
      const txHash = ((execResponse as any).transactionResponse?.hash || (execResponse as any).hash) as
        | `0x${string}`
        | undefined;

      let receipt: unknown = undefined;
      if (txHash) {
        receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
      }

      setStatus('success');
      return { txHash, receipt };
    } catch (error) {
      console.error('executeSafeTransaction error =>', error);
      setStatus('error');
      toast.error('执行交易失败');
      throw error;
    }
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
    if (!walletClient || !publicClient || !address || !chainId) {
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
      const decimals = tokenInfo.decimals;

      const value = parseUnits(t.amount, decimals);
      const data = encodeFunctionData({
        abi: erc20Abi,
        functionName: 'transfer',
        args: [t.to as Address, value],
      });

      return {
        to: tokenAddress,
        value: '0',
        data,
        operation: 0,
      } satisfies MetaTransactionData;
    });

    setStatus('loading');
    const safeWallet = await Safe.init({
      provider: walletClient as any,
      safeAddress,
    });

    const safeTransaction = await safeWallet.createTransaction({ transactions: txs });
    setStatus('success');
    return safeTransaction;
  };

  return {
    deploySafe,
    getTransactionHash,
    getPendingTransactions,
    signSafeTransaction,
    executeSafeTransaction,
    buildErc20TransfersSafeTransaction,
    status
  };
};

export default useSafeWallet;