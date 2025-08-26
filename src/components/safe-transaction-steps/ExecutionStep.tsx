"use client";

import { useEffect, useState } from 'react';
import { Button, Chip } from '@heroui/react';
import { toast } from 'sonner';
import useSafeWallet from '~/hooks/useSafeWallet';
import { delay_s } from '~/lib/utils';
import { SafeTransactionStep, SafeStepStatus } from '~/store';

interface ExecutionStepProps {
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

export function ExecutionStep({
  transactionHash,
  safeAddress,
  transactionDetail,
  walletInfo,
  onComplete,
  onStepChange
}: ExecutionStepProps) {
  const [loading, setLoading] = useState(false);
  const { initSafeInstance,apiKit } = useSafeWallet();

  // 判断是否应该显示（签名阈值达标）
  const shouldShow = (() => {
    if (!transactionDetail) return false; // hash 不存在
    if (transactionDetail.isExecuted) return false; // 已执行
    
    // 检查签名阈值是否达标
    const currentConfirmations = transactionDetail.confirmations?.length || 0;
    return currentConfirmations >= (walletInfo?.threshold || 0);
  })();

  // 是否已完成
  const isCompleted = transactionDetail?.isExecuted;

  useEffect(()=>{
    if(isCompleted && transactionHash){//默认吊起一次，主要是交付的时候需要用到
      setTimeout(() => {
        onStepChange?.(SafeTransactionStep.EXECUTION, SafeStepStatus.SUCCESS, { transactionHash });
      }, 300);
    }
  },[isCompleted,transactionHash]);

  // 执行交易
  const handleExecuteTransaction = async () => {
    setLoading(true);
    onStepChange?.(SafeTransactionStep.EXECUTION, SafeStepStatus.PROCESSING);
    
    try {
      toast.info('正在执行交易...');
      
      // 这里需要调用具体的执行方法
      const safeInstance = await initSafeInstance(safeAddress);
      const safeTransaction = await apiKit.getTransaction(transactionHash)
      await safeInstance.executeTransaction(safeTransaction);
      await delay_s(8000);
      toast.success('交易执行成功！');
      onStepChange?.(SafeTransactionStep.EXECUTION, SafeStepStatus.SUCCESS, { transactionHash });
      onComplete(); // 触发父组件刷新
    } catch (error) {
      console.error('执行交易失败:', error);
      const errorObj = error instanceof Error ? error : new Error('执行交易失败');
      toast.error(errorObj.message);
      onStepChange?.(SafeTransactionStep.EXECUTION, SafeStepStatus.ERROR, null, errorObj);
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
          ? 'bg-success border-success text-white' 
          : 'bg-default-100 border-default-200 text-default-400'
        }
      `}>
        {isCompleted ? (
          <i className="text-sm ri-check-line"></i>
        ) : (
          <i className="text-sm ri-rocket-line"></i>
        )}
      </div>
      
      {/* 步骤信息 */}
      <div className="flex-1 min-w-0">
        <div className={`font-medium ${
          isCompleted || shouldShow ? 'text-success' : 'text-default-400'
        }`}>
          执行交易
        </div>
        <div className="text-tiny text-default-500">所有签名完成，准备执行交易</div>
      </div>
      
      {/* 操作按钮区域 */}
      <div className="flex items-center flex-shrink-0 gap-2">
        {isCompleted && (
          <Chip size="sm" color="success" variant="flat">
            已执行
          </Chip>
        )}
        
        {!shouldShow && !isCompleted && (
          <Chip size="sm" color="default" variant="flat">
            等待中
          </Chip>
        )}
        
        {shouldShow && !isCompleted && (
          <Button
            color="success"
            variant="shadow"
            size="sm"
            isLoading={loading}
            onPress={handleExecuteTransaction}
            className="font-medium"
          >
            {loading ? '执行中...' : '执行交易'}
          </Button>
        )}
      </div>
    </div>
  );
}
