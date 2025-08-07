"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import AppBtn from "~/components/app-btn";
import RejectPodModal from "~/components/reject-pod-modal";
import ApprovePodModal from "~/components/approve-pod-modal";
import { api } from "~/trpc/react";
import { PodStatus, type Milestone } from "@prisma/client";
import { Alert } from "@heroui/react";
import Decimal from "decimal.js";

interface GpReviewActionsProps {
  podStatus: string;
  grantsPoolId: number;
  podId: number;
  podTitle: string;
  podWalletAddress: string;
  podCurrency: string;
  podTreasuryBalances: number;
  appliedAmount: number;
}

export default function GpReviewActions({ 
  podStatus, 
  grantsPoolId,
  podId,
  podTitle,
  podWalletAddress,
  podCurrency,
  podTreasuryBalances,
  appliedAmount
}: GpReviewActionsProps) {
  const router = useRouter();
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [onlyTransfer, setOnlyTransfer] = useState(false);//弹窗是否只是转账

  // 查询 Pod 的 milestones 信息
  const { data: podDetail } = api.pod.getById.useQuery(
    { id: podId },
    { enabled: !!podId }
  );

  const handleApprove = (onlyTransfer: boolean = false) => {
    setIsApproveModalOpen(true);
    setOnlyTransfer(onlyTransfer);
  };

  const handleReject = () => {
    setIsRejectModalOpen(true);
  };

  const handleModalSuccess = () => {
    // 刷新当前页面
    router.refresh();
  };

  // 如果国库余额不足，则显示提醒
  const shortage = Decimal(appliedAmount).minus(podTreasuryBalances).toNumber();
  

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
        endContent={<AppBtn btnProps={{color: "warning", onPress: ()=>handleApprove(true)}}>立即注入</AppBtn>}
      >
        <div className="text-sm text-secondary">Pod国库不足，注入预设资金，否则 Milestone 将无法交付！</div>
      </Alert> :
      podStatus === PodStatus.REVIEWING ?
      <Alert
        color="primary"
        variant="bordered"
        title="Pod 提交了申请，请完成审核！"
        className="mb-4"
        classNames={{base:'bg-background'}}
        endContent={
          <div className="flex items-center gap-4">
          <AppBtn  btnProps={{size: "sm", color: "success", onPress: ()=>handleApprove(false)}}>通过</AppBtn>
          <AppBtn btnProps={{size: "sm", color: "danger", onPress: handleReject}}>拒绝</AppBtn>
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
        onSuccess={handleModalSuccess}
        onlyTransfer={onlyTransfer}
      />
    </>
  );
}