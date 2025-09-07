"use client";

import { useEffect, useState } from 'react';
import { Button, Chip } from '@heroui/react';
import { toast } from 'sonner';
import useSafeWallet from '~/hooks/useSafeWallet';
import { delay_s } from '~/lib/utils';
import useStore, { SafeTransactionStep, SafeStepStatus } from '~/store';

interface ExecutionStepProps {
  transactionHash: string;
  safeAddress: string;
  transactionDetail: any;
  walletInfo: any;
  onComplete: () => void;
}

export function ExecutionStep({
  transactionHash,
  safeAddress,
  transactionDetail,
  walletInfo,
  onComplete,
}: ExecutionStepProps) {
  const [loading, setLoading] = useState(false);
  const { initSafeInstance,apiKit } = useSafeWallet();
  const { safeTransactionHandler } = useStore();

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

  // 执行交易
  const handleExecuteTransaction = async () => {
    setLoading(true);
    safeTransactionHandler?.onStepChange?.(SafeTransactionStep.EXECUTION, SafeStepStatus.PROCESSING);
    
    try {
      toast.info('Executing transaction...');
      
      // 执行交易
      const safeInstance = await initSafeInstance(safeAddress);
      const safeTransaction = await apiKit.getTransaction(transactionHash);
      await safeInstance.executeTransaction(safeTransaction);
      
      //!由于交易提交之后，safe 官方的接口什么时候更新状态不确定，这里轮训尽量保证业务是生效的
      for (let attempt = 1; attempt <= 6; attempt++) {
        await delay_s(4000); // 等待4秒
        
        try {
          const updatedTransaction = await apiKit.getTransaction(transactionHash);
          if (updatedTransaction.isExecuted === true) {
            onComplete(); // 触发父组件刷新
            return;
          }
          // 从第二次尝试开始显示提示
          if (attempt > 1) {
            toast.info(`Transaction still processing, ${6 - attempt} attempts remaining...`);
          }
        } catch (pollError) {
          console.error('轮询检查交易状态失败:', pollError);
          // 继续下一次尝试
        }
      }
      
      // 如果6次尝试后仍未完成
      toast.warning('Transaction execution is taking longer than expected. Please check the transaction status manually.');
      onComplete(); // 仍然触发刷新，让用户看到最新状态
      
    } catch (error) {
      console.error('执行交易失败:', error);
      const errorObj = error instanceof Error ? error : new Error('Transaction execution failed');
      toast.error(errorObj.message);
      safeTransactionHandler?.onStepChange?.(SafeTransactionStep.EXECUTION, SafeStepStatus.ERROR, null, errorObj);
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
      <div className="flex-1 min-w-0 space-y-1">
        <div className={`font-medium ${
          isCompleted || shouldShow ? 'text-success' : 'text-default-400'
        }`}>
          Execute Transaction
        </div>
        <div className="text-tiny text-default-500">All signatures are complete, ready to execute the transaction</div>
      </div>
      
      {/* 操作按钮区域 */}
      <div className="flex items-center flex-shrink-0 gap-2">
        {isCompleted && (
          <Chip size="sm" color="success" variant="flat">
            Executed
          </Chip>
        )}
        
        {!shouldShow && !isCompleted && (
          <Chip size="sm" color="default" variant="flat">
            Pending
          </Chip>
        )}
        
        {shouldShow && !isCompleted && (
          <Button
            color="success"
            variant="shadow"
            size="sm"
            isLoading={loading}
            onPress={handleExecuteTransaction}
            className="font-medium text-black"
          >
            {loading ? 'Executing...' : 'Execute Transaction'}
          </Button>
        )}
      </div>
    </div>
  );
}
