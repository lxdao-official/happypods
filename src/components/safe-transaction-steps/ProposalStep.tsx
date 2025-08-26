"use client";

import { useEffect, useMemo, useState } from 'react';
import { Button, Chip } from '@heroui/react';
import { toast } from 'sonner';
import useSafeWallet from '~/hooks/useSafeWallet';
import { useAccount } from 'wagmi';
import type { MetaTransactionData } from "@safe-global/types-kit";
import { SafeTransactionStep, SafeStepStatus } from '~/store';

interface ProposalStepProps {
  transactionHash: string;
  safeAddress: string;
  transfers: MetaTransactionData[];
  transactionDetail: any;
  walletInfo: any;
  onComplete: () => void;
  onStepChange?: (
    step: SafeTransactionStep, 
    status: SafeStepStatus, 
    data?: any, 
    error?: Error
  ) => void;
}

export function ProposalStep({
  transactionHash,
  safeAddress,
  transfers,
  transactionDetail,
  walletInfo,
  onComplete,
  onStepChange
}: ProposalStepProps) {
  const [loading, setLoading] = useState(false);
  const { apiKit,initSafeInstance } = useSafeWallet();
  const { address } = useAccount();
  // 检查当前钱包是否在多签 owners 中
  const isOwner = useMemo(() => {
    if (!walletInfo?.owners || !address) return false;
    return walletInfo.owners.some(
      (owner: string) => owner.toLowerCase() === address.toLowerCase()
    );
  }, [walletInfo?.owners, address]);

  // 判断是否应该显示按钮（需要是 owner 且交易未创建）
  const shouldShow = useMemo(() => {
    if (!isOwner) return false; // 不是 owner 不显示按钮
    return !transactionDetail;
  }, [isOwner, transactionDetail]);
  
  // 是否已完成
  const isCompleted = !!transactionDetail;

  useEffect(()=>{
    if(isCompleted && transactionHash){//默认吊起一次，主要是交付的时候需要用到
      onStepChange?.(SafeTransactionStep.PROPOSAL, SafeStepStatus.SUCCESS, { transactionHash });
    }
  },[isCompleted,transactionHash]);
  

  // 创建提案
  const handleCreateProposal = async () => {
    setLoading(true);
    onStepChange?.(SafeTransactionStep.PROPOSAL, SafeStepStatus.PROCESSING);
    
    try {
      toast.info('正在创建交易提案...');
      
      // 只负责创建提案，不做其他操作
      const safeInstance = await initSafeInstance(safeAddress);
      console.log(safeInstance);

      console.log({transactionDetail,transfers});
      
      const senderSignature = await safeInstance.signHash(transactionHash)

      if(!address) return;

      // 使用 MetaTransactionData 直接创建交易
      const safeTransaction = await safeInstance.createTransaction({ 
        transactions: transfers 
      });
      console.log('safeTransaction===>',safeTransaction);

      await apiKit.proposeTransaction({
        safeAddress,
        safeTransactionData: safeTransaction.data as any,
        safeTxHash: transactionHash,
        senderAddress: address,
        senderSignature: senderSignature.data
      })
      
      toast.success('提案创建成功！');
      onStepChange?.(SafeTransactionStep.PROPOSAL, SafeStepStatus.SUCCESS, { transactionHash });
      onComplete(); // 触发父组件刷新
      
    } catch (error) {
      console.error('创建提案失败:', error);
      const errorObj = error instanceof Error ? error : new Error('创建提案失败');
      toast.error(errorObj.message);
      onStepChange?.(SafeTransactionStep.PROPOSAL, SafeStepStatus.ERROR, null, errorObj);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      {/* 状态指示器 */}
      <div className={`
        w-8 h-8 rounded-full flex items-center justify-center border-2 flex-shrink-0
        ${isCompleted 
          ? 'bg-success border-success text-white' 
          : shouldShow 
          ? 'bg-primary border-primary text-white' 
          : 'bg-default-100 border-default-200 text-default-400'
        }
      `}>
        {isCompleted ? (
          <i className="text-sm ri-check-line"></i>
        ) : (
          <i className="text-sm ri-file-add-line"></i>
        )}
      </div>
      
      {/* 步骤信息 */}
      <div className="flex-1 min-w-0">
        <div className={`font-medium ${
          isCompleted || shouldShow ? 'text-success' : 'text-default-400'
        }`}>
          创建提案
        </div>
        <div className="text-tiny text-default-500">在 Safe 钱包中创建交易提案</div>
      </div>
      
      {/* 操作按钮区域 */}
      <div className="flex items-center flex-shrink-0 gap-2">
        {isCompleted && (
          <Chip size="sm" color="success" variant="flat">
            已完成
          </Chip>
        )}
        
        {!isOwner && !isCompleted && (
          <Chip size="sm" color="default" variant="flat">
            无权限
          </Chip>
        )}
        
        {isOwner && !shouldShow && !isCompleted && (
          <Chip size="sm" color="default" variant="flat">
            等待中
          </Chip>
        )}
        
        {shouldShow && !isCompleted && (
          <Button
            color="primary"
            variant="shadow"
            size="sm"
            isLoading={loading}
            onPress={handleCreateProposal}
            className="font-medium"
          >
            {loading ? '创建中...' : '创建提案'}
          </Button>
        )}
      </div>
    </div>
  );
}
