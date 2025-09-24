"use client";

import { useState, useMemo, useEffect } from 'react';
import { Button, Chip } from '@heroui/react';
import { toast } from 'sonner';
import { useAccount } from 'wagmi';
import useStore, { SafeTransactionStep, SafeStepStatus } from '~/store';
import useSafeWallet from '~/hooks/useSafeWallet';

interface ConfirmationStepProps {
  transactionHash: string;
  safeAddress: string;
  transactionDetail: any;
  walletInfo: any;
  onComplete: () => void;
}

export function ConfirmationStep({
  transactionHash,
  transactionDetail,
  walletInfo,
  onComplete,
}: ConfirmationStepProps) {
  const [loading, setLoading] = useState(false);
  const { address } = useAccount();
  const { safeTransactionHandler } = useStore();
  const { initSafeInstance, apiKit } = useSafeWallet();

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


  
  // 多签确认
  const handleConfirmTransaction = async () => {
    setLoading(true);
    safeTransactionHandler?.onStepChange?.(SafeTransactionStep.CONFIRMATION, SafeStepStatus.PROCESSING);
    
    try {
      toast.info('Signing confirmation...');
      
      // Initialize Safe instance
      const safeInstance = await initSafeInstance(walletInfo.safeAddress);
      
      // Sign the transaction hash
      const signature = await safeInstance.signHash(transactionHash);
      
      // Confirm the Safe transaction
      const signatureResponse = await apiKit.confirmTransaction(transactionHash, signature.data);
      
      if (signatureResponse) {
        toast.success('Signature confirmed successfully!');
      }
      
      // Get updated confirmation status
      const currentConfirmations = (transactionDetail?.confirmations?.length || 0) + 1;
      const requiredConfirmations = walletInfo?.threshold || 0;
      
      safeTransactionHandler?.onStepChange?.(SafeTransactionStep.CONFIRMATION, SafeStepStatus.SUCCESS, {
        transactionHash,
        confirmationsCount: currentConfirmations,
        confirmationsRequired: requiredConfirmations
      });
      
      onComplete(); // Trigger parent component refresh
      
    } catch (error) {
      console.error('Signature confirmation failed:', error);
      const errorObj = error instanceof Error ? error : new Error('Signature confirmation failed');
      toast.error(errorObj.message);
      safeTransactionHandler?.onStepChange?.(SafeTransactionStep.CONFIRMATION, SafeStepStatus.ERROR, null, errorObj);
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
          isCompleted ? 'text-success' : shouldShow ? 'text-warning' : 'text-black'
        }`}>
          Multi-sig Confirmation
        </div>
        <div className="text-tiny text-default-500">
          Waiting for multi-sig wallet members to confirm transaction
          <b className='text-red-500'>{transactionDetail && ` (${currentConfirmations}/${requiredConfirmations})`}</b>
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
            color="primary"
            variant="shadow"
            size="sm"
            isLoading={loading}
            onPress={handleConfirmTransaction}
            className="font-medium text-black"
          >
            {loading ? 'Signing...' : 'Confirm Transaction'}
          </Button>
        )}
      </div>
    </div>
  );
}
