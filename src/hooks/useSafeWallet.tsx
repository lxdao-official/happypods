import { useAccount, useWalletClient, usePublicClient, useChainId, useSwitchChain, useSendTransaction } from "wagmi";
import { useEffect, useMemo, useState, useCallback } from "react";
import Safe, { type SafeAccountConfig, type PredictedSafeProps } from '@safe-global/protocol-kit';
import SafeApiKit from '@safe-global/api-kit';
import { keccak256, type Address } from "viem";
import { toast } from "sonner";
import { delay_s } from "~/lib/utils";
import { buildErc20TransfersSafeTransaction, type TransferInput } from "~/lib/safeUtils";


const useSafeWallet = () => {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const chainId = useChainId();
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const { status: sendTransactionStatus, sendTransactionAsync } = useSendTransaction();

  // 通用的钱包连接检查
  const validateWalletConnection = useCallback(() => {
    if (!walletClient || !publicClient) {
      throw new Error("please connect wallet first");
    }
  }, [walletClient, publicClient]);

  const apiKit = useMemo(() => {
    return new SafeApiKit({
      chainId: BigInt(chainId),
      apiKey: process.env.NEXT_PUBLIC_SAFE_API_KEY
    })
  }, [chainId]);

  // 通用的Safe实例初始化
  const initSafeInstance = useCallback(async (safeAddress: string) => {
    validateWalletConnection();
    return await Safe.init({
      provider: walletClient as any,
      safeAddress
    });
  }, [walletClient, validateWalletConnection]);

   // 检查环境是否已经准备好
   const isReady = useMemo(()=>{
      return Boolean(walletClient && publicClient);
    },[
      walletClient,
      publicClient
    ])

  useEffect(() => {
    if (sendTransactionStatus === 'error') {
      toast.error('multisig wallet not created');
      setStatus('idle');
    }
    if (sendTransactionStatus === 'success') {
      setStatus('success');
    }
  }, [sendTransactionStatus]);




  // 通用的错误处理包装器
  const withErrorHandling = useCallback(async <T,>(
    operation: () => Promise<T>,
    errorMessage: string,
    setLoading = true
  ): Promise<T> => {
    try {
      if (!isReady) {
        toast.error('SDK not ready!');
        return undefined as any;
      }
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
  }, [isReady]);

  // 部署多签钱包合约
  const deploySafe = async (owners: string[] = [], threshold = 1) => {
    return withErrorHandling(async () => {
      validateWalletConnection();
      
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
      
      // 创建部署交易
      try {
        const deploymentTransaction = await protocolKit.createSafeDeploymentTransaction();
        await sendTransactionAsync({
          to: deploymentTransaction.to as Address,
          value: BigInt(deploymentTransaction.value),
          data: deploymentTransaction.data as `0x${string}`
        });
        return { safeAddress };
      } catch (error) {
        console.log('error===>', error);
        toast.error('Create safe wallet failed or already exists, please try again!');
        throw error;
      }
      
    }, 'Create safe wallet failed');
  };

  // 创建并计算哈希多签交易：传入已构建的 SafeTransaction，返回 safeTxHash
  const getTransactionHash = async (safeAddress: string, transfers: TransferInput[]) => {
    try {
      const safeTransaction = await buildErc20TransfersSafeTransaction(safeAddress, transfers);
      const safeWallet = await initSafeInstance(safeAddress);
      const safeTxHash = await safeWallet.getTransactionHash(safeTransaction);
      console.log('safeTxHash===>',safeTxHash);
      return {
        safeTxHash,
        transfers
      };
    } catch (error) {
      console.log('error===>',error);
      return {
        safeTxHash: undefined,
        transfers
      }
    }
  };


  // 获取交易详情
  const getTransactionDetail = async (safeTransactionHash: string) => {
    return withErrorHandling(async () => {
      try {
        const transaction = await apiKit.getTransaction(safeTransactionHash);
        return transaction;
      } catch (error) {
        return null;
      }
    }, 'Get transaction detail failed', false);
  };

  // 获取钱包信息
  const getWallet = async (safeAddress: string) => {
    return withErrorHandling(async () => {
      const wallet = await apiKit.getSafeInfo(safeAddress);
      return wallet;
    }, 'Get wallet info failed', false);
  };

  // 检查并执行目标钱包的交易（当达到执行阈值时）
  const checkAndExecuteTargetSafeTransaction = async (
    targetSafeAddress: string,
    targetSafeTxHash: string
  ) => {
    try {
      toast.info('Checking if transaction can be executed...');
      // await delay_s(1000); // 等待网络同步
      
      // 重新获取A钱包的交易信息，确保获取最新状态
      const updatedTargetTransactionInfo = await getTransactionDetail(targetSafeTxHash);
      if (!updatedTargetTransactionInfo) {
        toast.error('Unable to fetch transaction information');
        return;
      }

      if (updatedTargetTransactionInfo.isExecuted) {
        toast.success('Transaction has already been executed!');
        return;
      }

      // 获取A钱包信息
      const { threshold: targetThreshold } = await apiKit.getSafeInfo(targetSafeAddress);
      const currentConfirmations = updatedTargetTransactionInfo.confirmations?.length || 0;

      console.log(`Transaction confirmation status: ${currentConfirmations}/${targetThreshold}`);

      // 检查是否达到执行阈值
      if (currentConfirmations >= targetThreshold) {
        toast.info('🎉 Transaction reached execution threshold, executing...');
        await delay_s(500);
        
        // 初始化A钱包实例进行执行
        const targetSafeWallet = await initSafeInstance(targetSafeAddress);
        const targetSafeTransaction = await apiKit.getTransaction(targetSafeTxHash);
        
        await targetSafeWallet.executeTransaction(targetSafeTransaction);
        toast.success('🚀 Transaction executed successfully! Nested multisig process completed!');
      } else {
        toast.info(`Transaction needs ${targetThreshold - currentConfirmations} more confirmation(s) to execute`);
      }
    } catch (error) {
      console.error('Error checking or executing transaction:', error);
      toast.error('Failed to check transaction execution status');
    }
  };
  return {
    deploySafe,
    getTransactionHash,
    buildErc20TransfersSafeTransaction,
    getTransactionDetail,
    getWallet,
    status,
    isReady,
    apiKit,
    initSafeInstance,
  };
};

export default useSafeWallet;