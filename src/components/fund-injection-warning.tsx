"use client";

import { Alert } from "@heroui/react";
import AppBtn from "~/components/app-btn";
import { FEE_CONFIG } from "~/lib/config";
import Decimal from "decimal.js";
import { type GrantsPoolTokens, MilestoneStatus, type GrantsPool, type Milestone, type Pod } from "@prisma/client";
import useSafeWallet from "~/hooks/useSafeWallet";
import { toast } from "sonner";
import { useMemo, useState } from "react";
import useStore, { SafeTransactionStep, SafeStepStatus } from "~/store";
import { delay_s, formatToken } from "~/lib/utils";
import { buildMetaTransactionData } from "~/lib/safeUtils";

interface FundInjectionWarningProps {
  pod: Pod & { 
    milestones: Milestone[];
    podTreasuryBalances: number; 
    grantsPool: GrantsPool; 
    currency: string 
  };
  shortage: number;
}

export default function FundInjectionWarning({ pod, shortage }: FundInjectionWarningProps) {
  const { isReady: safeWalletReady } = useSafeWallet();
  const { userInfo, setSafeTransactionHandler,setPodDetailRefreshKey,clearSafeTransactionHandler } = useStore();
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // 构建注资交易参数
  const transactionParams = useMemo(() => {
    if (!safeWalletReady) return null;

    try {
      return {
        safeAddress: pod.grantsPool.treasuryWallet,
        transfers: [buildMetaTransactionData(
          pod.currency as GrantsPoolTokens,
          pod.walletAddress,
          shortage.toString()
        )]
      };
    } catch (error) {
      console.error('build fund injection transaction params failed:', error);
      return null;
    }
  }, [shortage, pod.grantsPool.treasuryWallet, pod.walletAddress, pod.currency, safeWalletReady]);

  // 权限检查：只要用户已登录就显示按钮
  const hasUser = Boolean(userInfo?.walletAddress);

  // 发起注资交易
  const handleFundInjection = async () => {
    if (!transactionParams || isProcessing) return;
    try {
      const safeAddress = transactionParams.safeAddress;
      const transfersData = transactionParams.transfers;

      // 构建交易描述
      const getTransactionDescription = () => (
        <div className="space-y-3">
          <div className="p-3 border rounded-lg bg-warning/5 border-warning/10">
            <div className="space-y-1 text-small">
              <div className="flex justify-between">
                <span>Amount:</span>
                <span className="font-mono text-warning">{formatToken(shortage)} {pod.currency}</span>
              </div>
              <div className="flex justify-between">
                <span>From:</span>
                <span className="font-mono text-tiny">{pod.grantsPool.treasuryWallet.slice(0, 6)}...{pod.grantsPool.treasuryWallet.slice(-4)}</span>
              </div>
              <div className="flex justify-between">
                <span>To:</span>
                <span className="font-mono text-tiny">{pod.walletAddress.slice(0, 6)}...{pod.walletAddress.slice(-4)}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-tiny text-primary">
            <i className="ri-alert-line"></i>
            <span>Requires GP multi-sig wallet confirmation</span>
          </div>
        </div>
      );

      // 触发交易处理 modal
      setSafeTransactionHandler({
        safeAddress,
        transfers: transfersData,
        title: 'GP Fund Injection',
        description: getTransactionDescription(),

        onClose: () => {
          setIsProcessing(false);
        },

        onStepChange: async (step, status, data, error) => {
          console.log('Fund injection transaction step change:', { step, status, data, error });
          
          // 当注资交易完成后
          if (step === SafeTransactionStep.EXECUTION && status === SafeStepStatus.SUCCESS) {
            try {
              toast.success('Fund injection successful!');
              clearSafeTransactionHandler();
              await delay_s(3000);
              setPodDetailRefreshKey();
            } catch (error) {
              console.error('Fund injection completion failed:', error);
              toast.error('Fund injection completion failed');
            }
          }

          // 处理错误状态
          if (status === SafeStepStatus.ERROR && error) {
            console.error('Fund injection failed:', error, 'at step:', step);
            toast.error(`❌ Fund injection failed at ${step}: ${error.message}`);
            setIsProcessing(false);
          }
        }
      });

    } catch (error) {
      console.error('资金注入操作失败:', error);
      toast.error('Fund injection failed, please retry');
    } finally {
      setIsProcessing(false);
    }
  };

  const endContent = (
    <div className="flex items-center gap-2">
      {hasUser && (
        <AppBtn 
          btnProps={{ 
            color: 'warning', 
            onPress: handleFundInjection,
            isLoading: isProcessing,
            isDisabled: isProcessing
          }}
        >
          {isProcessing ? 'Processing...' : 'Fund Pod Treasury'}
        </AppBtn>
      )}
    </div>
  );

  return (
    <div className="fadeIn">
      <Alert
        color="warning"
        variant="flat"
        title="Pod Treasury Balance Insufficient!"
        className="mb-4"
        classNames={{ base: "bg-background" }}
        endContent={endContent}
      >
        <div>
          <div className="mt-1 text-sm text-secondary">
            Please coordinate with the GP treasury multi-sig user to inject the missing funds{' '}
            <b className="text-warning">{formatToken(shortage)} {pod.currency}</b>, otherwise the Milestone cannot be delivered!
          </div>
        </div>
      </Alert>
    </div>
  );
}
