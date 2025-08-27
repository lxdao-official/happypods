"use client";

import { Chip } from '@heroui/react';
import { SafeTransactionStep, SafeStepStatus } from '~/store';
import { useEffect } from 'react';

interface CompletedStepProps {
  transactionHash: string;
  safeAddress: string;
  transactionDetail: any;
  walletInfo: any;
  onStepChange?: (
    step: SafeTransactionStep, 
    status: SafeStepStatus, 
    data?: any, 
    error?: Error
  ) => void;
}

export function CompletedStep({
  transactionHash,
  safeAddress,
  transactionDetail,
  walletInfo,
  onStepChange
}: CompletedStepProps) {
  // 判断是否应该显示（交易已完成执行）
  const shouldShow = transactionDetail?.isExecuted;

  // 当交易完成时通知父组件
  useEffect(() => {
    if (shouldShow && onStepChange) {
      onStepChange(SafeTransactionStep.COMPLETED, SafeStepStatus.SUCCESS, { 
        transactionHash,
        completedAt: new Date().toISOString()
      });
    }
  }, [shouldShow, onStepChange, transactionHash]);

  return (
    <div className="flex items-center gap-3">
      {/* 状态指示器 */}
      <div className={`
        w-8 h-8 rounded-full flex items-center justify-center border-2 flex-shrink-0
        ${shouldShow 
          ? 'bg-success border-success text-white' 
          : 'bg-default-100 border-default-200 text-default-400'
        }
      `}>
        <i className="text-sm ri-shield-check-line"></i>
      </div>
      
      {/* 步骤信息 */}
      <div className="flex-1 min-w-0">
        <div className={`font-medium ${shouldShow ? 'text-success' : 'text-default-400'}`}>
          Transaction Completed
        </div>
        <div className="text-tiny text-default-500">Transaction has been successfully confirmed on the blockchain</div>
      </div>
      
      {/* 操作按钮区域 */}
      <div className="flex items-center flex-shrink-0 gap-2">
        {shouldShow && (
          <Chip size="sm" color="success" variant="flat">
            Completed
          </Chip>
        )}
        
        {!shouldShow && (
          <Chip size="sm" color="default" variant="flat">
            Pending
          </Chip>
        )}
      </div>
    </div>
  );
}
