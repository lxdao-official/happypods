"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AppBtn from "~/components/app-btn";
import RejectPodModal from "~/components/reject-pod-modal";
import ApprovePodModal from "~/components/approve-pod-modal";
import { api } from "~/trpc/react";
import { PodStatus, type Milestone } from "@prisma/client";
import { Alert } from "@heroui/react";
import Decimal from "decimal.js";
import Link from "next/link";
import { FEE_CONFIG } from "~/lib/config";

interface GpReviewActionsProps {
  podStatus: string;
  grantsPoolId: number;
  podId: number;
  podTitle: string;
  podWalletAddress: string;
  podCurrency: string;
  podTreasuryBalances: number;
  appliedAmount: number;
  treasuryWallet: string;
  requiredAmount: number;
}

export default function GpReviewActions({ 
  podStatus, 
  podId,
  podTitle,
  podWalletAddress,
  podCurrency,
  podTreasuryBalances,
  appliedAmount,
  treasuryWallet,
  requiredAmount
}: GpReviewActionsProps) {
  const router = useRouter();
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);

  const handleApprove = () => {
    setIsApproveModalOpen(true);
  };

  const handleReject = () => {
    setIsRejectModalOpen(true);
  };

  const handleModalSuccess = () => {
    router.refresh();
  };

  // 如果国库余额交付+手续费不足，则显示提醒
  const shortage = Decimal(requiredAmount).mul(FEE_CONFIG.TRANSACTION_FEE_RATE+1).minus(podTreasuryBalances).toNumber();
  
  return (
    <>
    {
      shortage > 0 && podStatus === PodStatus.IN_PROGRESS ?
        <Alert
        color="warning"
        variant="bordered"
        title="国库余额不足！"
        className="mb-4"
        classNames={{base: 'bg-background'}}
        endContent={
        <Link href={`https://app.safe.global/transactions/queue?safe=oeth:${treasuryWallet}`} target="_blank">
          <AppBtn btnProps={{color: "warning"}}>
            <div className="flex gap-2">
              <span>完成多签转账</span>
              <i className="ri-external-link-line"></i>
            </div>
          </AppBtn>
        </Link>
        }
      >
        <small className="mt-1 text-secondary">请协调多签用户完成 Pod 注入预设资金，否则 Milestone 将无法交付！</small>
      </Alert> :
      podStatus === PodStatus.REVIEWING ?
      <Alert
        variant="bordered"
        title="Pod 提交了申请，请完成审核！"
        className="mb-4"
        classNames={{base:'bg-background'}}
        endContent={
          <div className="flex items-center gap-4">
            <AppBtn btnProps={{size: "sm", color: "danger", onPress: handleReject}}>拒绝</AppBtn>
            <AppBtn  btnProps={{size: "sm", color: "success", onPress: handleApprove}}>通过</AppBtn>
        </div>
        }
      >
      </Alert> : null
    }

      {/* 拒绝Pod的Modal */}
      <RejectPodModal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        podId={podId}
        podTitle={podTitle}
        onSuccess={handleModalSuccess}
      />

      {/* 通过Pod的Modal */}
      <ApprovePodModal
        isOpen={isApproveModalOpen}
        onClose={() => setIsApproveModalOpen(false)}
        podId={podId}
        podTitle={podTitle}
        appliedAmount={appliedAmount}
        currency={podCurrency}
        walletAddress={podWalletAddress}
        treasuryWallet={treasuryWallet}
      />
    </>
  );
}