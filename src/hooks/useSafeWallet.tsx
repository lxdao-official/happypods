import { useAccount, useWalletClient, usePublicClient, useChainId, useSwitchChain, useSendTransaction } from "wagmi";
import { useEffect, useMemo, useState, useCallback } from "react";
import Safe, { type SafeAccountConfig, type PredictedSafeProps } from '@safe-global/protocol-kit';
import SafeApiKit from '@safe-global/api-kit';
import { keccak256 } from "viem";
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

  const apiKit = useMemo(() => {
    return new SafeApiKit({
      chainId: BigInt(chainId),
      apiKey: process.env.NEXT_PUBLIC_SAFE_API_KEY
    })
  }, [chainId]);

  useEffect(() => {
    if (sendTransactionStatus === 'error') {
      toast.error('multisig wallet not created');
      setStatus('idle');
    }
    if (sendTransactionStatus === 'success') {
      setStatus('success');
    }
  }, [sendTransactionStatus]);

  // 通用的钱包连接检查
  const validateWalletConnection = useCallback(() => {
    if (!walletClient || !publicClient) {
      throw new Error("please connect wallet first");
    }
  }, [walletClient, publicClient]);

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
    setLoading = true
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
          to: deploymentTransaction.to,
          value: BigInt(deploymentTransaction.value),
          data: deploymentTransaction.data as `0x${string}`
        });
        return { safeAddress };
      } catch (error) {
        console.log('error===>', error);
        toast.error('创建Safe多签钱包失败或已存在，请重试！');
        throw error;
      }
      
    }, '创建Safe多签钱包失败');
  };

  // 创建并计算哈希多签交易：传入已构建的 SafeTransaction，返回 safeTxHash
  const getTransactionHash = async (safeAddress: string, transfers: TransferInput[]) => {
    return withErrorHandling(async () => {
    const safeTransaction = await buildErc20TransfersSafeTransaction(safeAddress, transfers);
      const safeWallet = await initSafeInstance(safeAddress);
      const safeTxHash = await safeWallet.getTransactionHash(safeTransaction);
      console.log('safeTxHash===>',safeTxHash);
      return {
        safeTxHash,
        transfers
      };
    }, '交易 hash 获取失败');
  };

  // 提案或者执行交易
  const proposeOrExecuteTransaction = async (safeAddress: string, transfers: TransferInput[]) => {
    const {safeTxHash} = await getTransactionHash(safeAddress, transfers);
    console.log('safeTxHash11===>',safeTxHash);
    if(!safeTxHash) return;

    const safeErc20Transaction = await buildErc20TransfersSafeTransaction(safeAddress, transfers);
    console.log('safeErc20Transaction===>',safeErc20Transaction);

    const safeWallet = await initSafeInstance(safeAddress);
    console.log('safeWallet===>',safeWallet, safeAddress);

     const {threshold, owners} = await apiKit.getSafeInfo(safeAddress);
     console.log('owners===>',owners);

     const osOwners = owners.some(owner => owner.toLocaleLowerCase() === address?.toLocaleLowerCase());
     if(!osOwners) return toast.error('You are not the owner of the multi-sig wallet, cannot initiate transactions');

     // 查询交易
     let transactionInfo;
     try {
      transactionInfo = await getTransactionDetail(safeTxHash);
     } catch (error) {
      console.log('get transactionInfo error===>',error);
     }

     // 交易不存在，需要签名并发起提案
     if (!transactionInfo) {
      console.log('签名并发起提案==>');
       const senderSignature = await safeWallet.signHash(safeTxHash);
       toast.info('Signed and proposed transaction');
       await apiKit.proposeTransaction({
         safeAddress,
         safeTransactionData: safeErc20Transaction.data,
         safeTxHash: safeTxHash,
         senderAddress: address!,
         senderSignature: senderSignature.data
       });
     }

    //  交易不存在，且阈值为 1 则直接确认，发起
     if(threshold === 1) {
      console.log('直接执行==>');
      toast.info('Execute transaction');
      const safeTransaction = await apiKit.getTransaction(safeTxHash)
      await safeWallet.executeTransaction(safeTransaction);
      return safeTxHash;
     }

    //  交易存在，且自己已经签名，但是未执行，等待其他人签名
    if(
      transactionInfo?.confirmations?.length && 
      !transactionInfo.isExecuted &&
      transactionInfo.confirmationsRequired > transactionInfo.confirmations?.length &&
      transactionInfo.confirmations.some(confirmation => confirmation.owner.toLocaleLowerCase() === address?.toLocaleLowerCase())
    ) {
      console.log('交易存在，且自己已经签名，等待其他人签名==>');
      return safeTxHash;
    }

     // 交易存在，且加上自己的签名可以直接执行，则直接执行
     if(
      transactionInfo?.confirmations?.length && 
      transactionInfo.confirmations.length+1 >= transactionInfo.confirmationsRequired &&
      !transactionInfo.confirmations.some(confirmation => confirmation.owner.toLocaleLowerCase() === address?.toLocaleLowerCase())
     ) {
        console.log('交易存在，且加上自己的签名可以直接执行，则直接执行==>');

        toast.info('Confirm transaction');
        const signature = await safeWallet.signHash(safeTxHash);
        await apiKit.confirmTransaction(safeTxHash, signature.data);

        toast.info('Execute transaction');
        await delay_s(300);

        const safeTransaction = await apiKit.getTransaction(safeTxHash)
        await safeWallet.executeTransaction(safeTransaction);
        return safeTxHash;
     }

    //  存在交易，签名准备完成，直接可以交易
    if(
      transactionInfo?.confirmations?.length && 
      transactionInfo.confirmations.length+1 >= transactionInfo.confirmationsRequired
    ) {
      console.log('交易存在，签名准备完成，直接可以交易==>');
      toast.info('Execute transaction');
      const safeTransaction = await apiKit.getTransaction(safeTxHash)
      await safeWallet.executeTransaction(safeTransaction);
      return safeTxHash;
    }

     return safeTxHash;
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
    }, '获取交易详情失败', false);
  };

  // 获取钱包信息
  const getWallet = async (safeAddress: string) => {
    return withErrorHandling(async () => {
      const wallet = await apiKit.getSafeInfo(safeAddress);
      return wallet;
    }, '获取钱包信息失败', false);
  };

  // 检查环境是否已经准备好
  const isReady = useMemo(()=>{
    return Boolean(walletClient && publicClient);
  },[
    walletClient,
    publicClient
  ])

  return {
    deploySafe,
    getTransactionHash,
    buildErc20TransfersSafeTransaction,
    getTransactionDetail,
    proposeOrExecuteTransaction,
    getWallet,
    status,
    isReady
  };
};

export default useSafeWallet;