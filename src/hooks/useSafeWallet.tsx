import { useAccount, useWalletClient, usePublicClient, useChainId, useSwitchChain, useSendTransaction } from "wagmi";
import { useEffect, useMemo, useState, useCallback } from "react";
import Safe, { type SafeAccountConfig, type PredictedSafeProps } from '@safe-global/protocol-kit';
import SafeApiKit from '@safe-global/api-kit';
import { keccak256, encodeFunctionData } from "viem";
import { toast } from "sonner";
import { delay_s } from "~/lib/utils";
import { buildErc20TransfersSafeTransaction, type TransferInput } from "~/lib/safeUtils";
import { OperationType, type MetaTransactionData, type SafeTransactionData } from "@safe-global/types-kit";


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
          to: deploymentTransaction.to,
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

  // 提案或者执行交易
  const proposeOrExecuteTransaction = async (safeAddress: string, transfers: TransferInput[]) => {
    console.log('111===>',safeAddress,transfers);
    const {safeTxHash} = await getTransactionHash(safeAddress, transfers);
    console.log('safeTxHash11===>',safeTxHash);
    if(!safeTxHash) return;
    const transfersSorted = transfers.sort((a,b)=>a.to.localeCompare(b.to));
    const safeErc20Transaction = await buildErc20TransfersSafeTransaction(safeAddress, transfersSorted);
    console.log('safeErc20Transaction===>',safeErc20Transaction);

    const safeWallet = await initSafeInstance(safeAddress);
    console.log('safeWallet===>',safeWallet, safeAddress);

     const {threshold, owners} = await apiKit.getSafeInfo(safeAddress);
     console.log('owners===>',owners);

     const osOwners = owners.some(owner => owner.toLocaleLowerCase() === address?.toLocaleLowerCase());
     if(!osOwners){
      toast.error('You are not the owner of the multi-sig wallet, cannot initiate transactions')
      return;
     };

     // 查询交易
     let transactionInfo;
     try {
      transactionInfo = await getTransactionDetail(safeTxHash);
      console.log('获取到交易信息==?>',transactionInfo);
     } catch (error) {
      console.log('get transactionInfo error===>',error);
     }

     // 交易不存在，需要签名并发起提案
     if (!transactionInfo) {
      console.log('签名并发起提案==>');
       const senderSignature = await safeWallet.signHash(safeTxHash);
       toast.info('Please confirm and propose transaction');
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
      toast.info('Please execute the transaction');
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

        toast.info('Please confirm transaction');
        const signature = await safeWallet.signHash(safeTxHash);
        await apiKit.confirmTransaction(safeTxHash, signature.data);

        toast.info('Please execute the transaction');
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

  // A钱包（B+C） -> C钱包（D+E）
  // 嵌套多签确认：C钱包通过D和E来确认A钱包的交易
  const confirmTransactionViaNestedMultisig = async (
    targetSafeAddress: string, // A钱包地址
    targetSafeTxHash: string,  // A钱包的交易hash
    nestedSafeAddress: string  // C钱包地址（嵌套多签）
  ) => {
    return withErrorHandling(async () => {
      // 1. 检查当前用户是否为C钱包的Owner（D或E）
      const { threshold: nestedThreshold, owners: nestedOwners } = await apiKit.getSafeInfo(nestedSafeAddress);
      const isNestedOwner = nestedOwners.some(owner => owner.toLowerCase() === address?.toLowerCase());
      
      if (!isNestedOwner) {
        toast.error('You are not authorized to confirm this transaction');
        return;
      }

      // 2. 检查C钱包是否为A钱包的Owner
      const { owners: targetOwners } = await apiKit.getSafeInfo(targetSafeAddress);
      const isTargetOwner = targetOwners.some(owner => owner.toLowerCase() === nestedSafeAddress.toLowerCase());
      
      if (!isTargetOwner) {
        toast.error('Multisig wallet is not authorized for this transaction');
        return;
      }

      // 3. 获取A钱包的交易详情
      const targetTransactionInfo = await getTransactionDetail(targetSafeTxHash);
      if (!targetTransactionInfo) {
        toast.error('Transaction not found');
        return;
      }

      if (targetTransactionInfo.isExecuted) {
        toast.info('Transaction has already been executed');
        return targetSafeTxHash;
      }

      // 4. 检查C钱包是否已经确认过A的交易
      const hasNestedConfirmed = targetTransactionInfo.confirmations?.some(
        confirmation => confirmation.owner.toLowerCase() === nestedSafeAddress.toLowerCase()
      );

      if (hasNestedConfirmed) {//已经完成确认，直接执行 C 钱包交易，发起 A 的目标交易确认
        toast.info('Multisig wallet has already confirmed this transaction');
        await checkAndExecuteTargetSafeTransaction(targetSafeAddress, targetSafeTxHash);
        return targetSafeTxHash;
      }

      // 5. 构建C钱包的确认交易：调用A钱包的approveHash方法
      const approveHashData = encodeFunctionData({
        abi: [
          {
            "inputs": [{"name": "hashToApprove", "type": "bytes32"}],
            "name": "approveHash",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
          }
        ],
        functionName: 'approveHash',
        args: [targetSafeTxHash as `0x${string}`]
      });

      const approveTransaction: MetaTransactionData = {
        to: targetSafeAddress,
        value: '0',
        data: approveHashData,
        operation: OperationType.Call
      };

      // 6. 初始化C钱包
      const nestedSafeWallet = await initSafeInstance(nestedSafeAddress);
      
      // 7. 创建C钱包的交易
      const nestedSafeTransaction = await nestedSafeWallet.createTransaction({
        transactions: [approveTransaction]
      });

      // 8. 获取C钱包交易的hash
      const nestedSafeTxHash = await nestedSafeWallet.getTransactionHash(nestedSafeTransaction);
      
      // 9. 检查C钱包中是否已存在这个确认交易
      let nestedTransactionInfo;
      try {
        nestedTransactionInfo = await getTransactionDetail(nestedSafeTxHash);
      } catch (error) {
        console.log('嵌套交易不存在，将创建新的');
      }

      // 10. 如果C钱包的确认交易不存在，创建提案
      if (!nestedTransactionInfo) {
        toast.info('Creating confirmation proposal in multisig wallet...');
        const signature = await nestedSafeWallet.signHash(nestedSafeTxHash);
        
        await apiKit.proposeTransaction({
          safeAddress: nestedSafeAddress,
          safeTransactionData: nestedSafeTransaction.data,
          safeTxHash: nestedSafeTxHash,
          senderAddress: address!,
          senderSignature: signature.data
        });
        
        // 如果C钱包阈值为1，立即执行并检查A钱包
        if (nestedThreshold === 1) {
          toast.info('Single-signature wallet, executing immediately...');
          const nestedSafeTransactionToExecute = await apiKit.getTransaction(nestedSafeTxHash);
          await nestedSafeWallet.executeTransaction(nestedSafeTransactionToExecute);
          toast.success('Transaction confirmed successfully!');
          await delay_s(5000); //保证交易完成
          // 检查A钱包是否可以执行最终交易
          await checkAndExecuteTargetSafeTransaction(targetSafeAddress, targetSafeTxHash);
        } else {
          toast.success('Confirmation proposal created successfully, waiting for other owners');
        }
        
        return { nestedSafeTxHash, targetSafeTxHash };
      }

      // 11. 如果C钱包的确认交易存在但未执行，尝试确认或执行
      if (!nestedTransactionInfo.isExecuted) {
        const hasConfirmedNested = nestedTransactionInfo.confirmations?.some(
          confirmation => confirmation.owner.toLowerCase() === address?.toLowerCase()
        );

        if (!hasConfirmedNested) {
          toast.info('Confirming multisig transaction...');
          const signature = await nestedSafeWallet.signHash(nestedSafeTxHash);
          await apiKit.confirmTransaction(nestedSafeTxHash, signature.data);
          toast.success('Multisig transaction confirmed successfully');
        }

        // 检查是否可以执行C钱包的交易
        const currentNestedConfirmations = (nestedTransactionInfo.confirmations?.length || 0) + (hasConfirmedNested ? 0 : 1);
        if (currentNestedConfirmations >= nestedThreshold) {
          toast.info('Executing multisig confirmation transaction...');
          await delay_s(300);
          
          const nestedSafeTransactionToExecute = await apiKit.getTransaction(nestedSafeTxHash);
          await nestedSafeWallet.executeTransaction(nestedSafeTransactionToExecute);
          toast.success('Transaction confirmation executed successfully!');
          
          // C钱包执行完成后，检查A钱包是否可以执行最终交易
          await checkAndExecuteTargetSafeTransaction(targetSafeAddress, targetSafeTxHash);
          
          return { nestedSafeTxHash, targetSafeTxHash };
        } else {
          toast.info(`Multisig transaction needs ${nestedThreshold - currentNestedConfirmations} more confirmation(s)`);
        }
      }

      return { nestedSafeTxHash, targetSafeTxHash };
    }, 'Nested multisig confirmation failed');
  };

  return {
    deploySafe,
    getTransactionHash,
    buildErc20TransfersSafeTransaction,
    getTransactionDetail,
    proposeOrExecuteTransaction,
    confirmTransactionViaNestedMultisig,
    getWallet,
    status,
    isReady
  };
};

export default useSafeWallet;