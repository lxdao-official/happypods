import { useAccount, useWalletClient, usePublicClient, useChainId, useSwitchChain, useSendTransaction } from "wagmi";
import { useEffect, useState } from "react";
import Safe, { type SafeAccountConfig, type PredictedSafeProps } from '@safe-global/protocol-kit';
import { optimism } from 'viem/chains';
import { keccak256 } from "viem";
import { toast } from "sonner";

const useSafeWallet = ({saltNonce}:{saltNonce:string}) => {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const { sendTransaction,status:sendTransactionStatus } = useSendTransaction();

  useEffect(() => {
    if (sendTransactionStatus === 'success') {
      setStatus('success');
    }
  }, [sendTransactionStatus]);

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

    
    const customString = `safe-deploy-${saltNonce}`;
    const saltNonceHash = keccak256(Buffer.from(customString)); // 哈希为十六进制
    console.log('saltNonce==>',saltNonce,saltNonceHash);

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

  return {
    deploySafe,
    status
  };
};

export default useSafeWallet;