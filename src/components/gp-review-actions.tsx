"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AppBtn from "~/components/app-btn";
import RejectPodModal from "~/components/reject-pod-modal";
import ApprovePodModal from "~/components/approve-pod-modal";
import { PodStatus, type Milestone } from "@prisma/client";
import { Alert } from "@heroui/react";

interface GpReviewActionsProps {
  podStatus: string;
  grantsPoolId: number;
  podId: number;
  podTitle: string;
  podWalletAddress: string;
  podCurrency: string;
  appliedAmount: number;
  treasuryWallet: string;
}

export default function GpReviewActions({ 
  podStatus, 
  podId,
  podTitle,
  podWalletAddress,
  podCurrency,  
  appliedAmount,
  treasuryWallet
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
  
  return (
    <>
      {/* Pod 审核提醒 */}
      {podStatus === PodStatus.REVIEWING && (
        <Alert
          variant="bordered"
          color="warning"
          title="Pod 提交了申请，请完成审核！"
          className="mb-4"
          classNames={{ base: "bg-background" }}
          endContent={
            <div className="flex items-center gap-4">
              <AppBtn
                btnProps={{ size: "sm", color: "danger", onPress: handleReject }}
              >
                拒绝
              </AppBtn>
              <AppBtn
                btnProps={{ size: "sm", color: "success", onPress: handleApprove }}
              >
                通过
              </AppBtn>
            </div>
          }
        >
        </Alert>
      )}

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