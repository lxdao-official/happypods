"use client";

import { useState, useMemo, useEffect } from 'react';
import { Button, Chip } from '@heroui/react';
import { toast } from 'sonner';
import { useAccount } from 'wagmi';
import { SafeTransactionStep, SafeStepStatus } from '~/store';

interface ConfirmationStepProps {
  transactionHash: string;
  safeAddress: string;
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

export function ConfirmationStep({
  transactionHash,
  safeAddress,
  transactionDetail,
  walletInfo,
  onComplete,
  onStepChange
}: ConfirmationStepProps) {
  const [loading, setLoading] = useState(false);
  const { address } = useAccount();

  // 检查当前钱包是否在多签 owners 中
  const isOwner = useMemo(() => {
    if (!walletInfo?.owners || !address) return false;
    return walletInfo.owners.some(
      (owner: string) => owner.toLowerCase() === address.toLowerCase()
    );
  }, [walletInfo?.owners, address]);

  // 检查是否已经签名
  const hasSignedByMe = useMemo(() => {
    if (!transactionDetail?.confirmations || !address) return false;
    return transactionDetail.confirmations.some(
      (c: any) => c.owner.toLowerCase() === address.toLowerCase()
    );
  }, [transactionDetail?.confirmations, address]);

  // 判断是否应该显示按钮（需要是 owner 且满足所有条件）
  const shouldShow = useMemo(() => {
    if (!isOwner) return false; // 不是 owner 不显示按钮
    if (!transactionDetail) return false; // hash 不存在
    if (transactionDetail.isExecuted) return false; // 已执行
    
    // 检查多签阈值是否未达标
    const currentConfirmations = transactionDetail.confirmations?.length || 0;
    if (currentConfirmations >= walletInfo?.threshold) return false;
    
    // 检查我是否已经签名
    if (hasSignedByMe) return false;
    
    return true;
  }, [isOwner, transactionDetail, walletInfo?.threshold, hasSignedByMe]);

  // 是否已完成（已签名或已执行）
  const isCompleted = useMemo(() => {
    if (!transactionDetail) return false;
    if (transactionDetail.confirmations && transactionDetail.confirmations.length >= transactionDetail.confirmationsRequired) return true;
    return hasSignedByMe;
  }, [transactionDetail, hasSignedByMe]);


  useEffect(()=>{
    if(isCompleted && transactionHash){//默认吊起一次，主要是交付的时候需要用到
      setTimeout(() => {
        onStepChange?.(SafeTransactionStep.CONFIRMATION, SafeStepStatus.SUCCESS, { transactionHash });
      }, 200);
    }
  },[isCompleted,transactionHash]);

  // 多签确认
  const handleConfirmTransaction = async () => {
    setLoading(true);
    onStepChange?.(SafeTransactionStep.CONFIRMATION, SafeStepStatus.PROCESSING);
    
    try {
      toast.info('Signing confirmation...');
      
      // 这里需要调用具体的签名方法
      // 暂时模拟
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success('Signature confirmed successfully!');
      
      // 获取更新后的确认状态
      const currentConfirmations = (transactionDetail?.confirmations?.length || 0) + 1;
      const requiredConfirmations = walletInfo?.threshold || 0;
      
      onStepChange?.(SafeTransactionStep.CONFIRMATION, SafeStepStatus.SUCCESS, {
        transactionHash,
        confirmationsCount: currentConfirmations,
        confirmationsRequired: requiredConfirmations
      });
      
      onComplete(); // 触发父组件刷新
      
    } catch (error) {
      console.error('签名确认失败:', error);
      const errorObj = error instanceof Error ? error : new Error('Signature confirmation failed');
      toast.error(errorObj.message);
      onStepChange?.(SafeTransactionStep.CONFIRMATION, SafeStepStatus.ERROR, null, errorObj);
    } finally {
      setLoading(false);
    }
  };

  // 获取当前签名进度
  const currentConfirmations = transactionDetail?.confirmations?.length || 0;
  const requiredConfirmations = walletInfo?.threshold || 0;

  return (
    <div className="flex items-center gap-3">
      {/* 状态指示器 */}
      <div className={`
        w-8 h-8 rounded-full flex items-center justify-center border-2 flex-shrink-0
        ${isCompleted 
          ? 'bg-success border-success text-white' 
          : shouldShow 
          ? 'bg-warning border-warning text-white' 
          : 'bg-default-100 border-default-200 text-default-400'
        }
      `}>
        {isCompleted ? (
          <i className="text-sm ri-check-line"></i>
        ) : (
          <i className="text-sm ri-team-line"></i>
        )}
      </div>
      
      {/* 步骤信息 */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className={`font-medium ${
          isCompleted ? 'text-success' : shouldShow ? 'text-warning' : 'text-default-400'
        }`}>
          Multi-sig Confirmation
        </div>
        <div className="text-tiny text-default-500">
          Waiting for multi-sig wallet members to confirm transaction
          {transactionDetail && ` (${currentConfirmations}/${requiredConfirmations})`}
        </div>
      </div>
      
      {/* 操作按钮区域 */}
      <div className="flex items-center flex-shrink-0 gap-2">
        {isCompleted && (
          <Chip size="sm" color="success" variant="flat">
            Signed
          </Chip>
        )}
        
        {!isOwner && !isCompleted && (
          <Chip size="sm" color="default" variant="flat">
            No Permission
          </Chip>
        )}
        
        {isOwner && !shouldShow && !isCompleted && (
          <Chip size="sm" color="default" variant="flat">
            Pending
          </Chip>
        )}
        
        {shouldShow && (
          <Button
            color="warning"
            variant="shadow"
            size="sm"
            isLoading={loading}
            onPress={handleConfirmTransaction}
            className="font-medium"
          >
            {loading ? 'Signing...' : 'Confirm Transaction'}
          </Button>
        )}
      </div>
    </div>
  );
}
