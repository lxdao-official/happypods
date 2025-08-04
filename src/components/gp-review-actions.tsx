"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import AppBtn from "~/components/app-btn";
import RejectPodModal from "~/components/reject-pod-modal";
import ApprovePodModal from "~/components/approve-pod-modal";
import { api } from "~/trpc/react";

interface GpReviewActionsProps {
  podStatus: string;
  grantsPoolId: number;
  podId: number;
  podTitle: string;
  podWalletAddress: string;
  podCurrency: string;
}

export default function GpReviewActions({ 
  podStatus, 
  grantsPoolId,
  podId,
  podTitle,
  podWalletAddress,
  podCurrency
}: GpReviewActionsProps) {
  const { address } = useAccount();
  const router = useRouter();
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);

  // 查询 GP 详情获取所有者信息
  const { data: grantsPoolDetail } = api.grantsPool.getById.useQuery(
    { id: grantsPoolId },
    { enabled: !!grantsPoolId }
  );

  // 查询 Pod 的 milestones 信息
  const { data: podDetail } = api.pod.getById.useQuery(
    { id: podId },
    { enabled: !!podId }
  );

  // 检查当前用户是否是 GP 创建者
  const isGpOwner = address && grantsPoolDetail?.owner?.walletAddress && 
    address.toLowerCase() === grantsPoolDetail.owner.walletAddress.toLowerCase();

  // 只有当 Pod 状态为 REVIEWING 且当前用户是 GP 创建者时才显示操作按钮
  if (podStatus !== 'REVIEWING' || !isGpOwner) {
    return null;
  }

  const handleApprove = () => {
    setIsApproveModalOpen(true);
  };

  const handleReject = () => {
    setIsRejectModalOpen(true);
  };

  const handleModalSuccess = () => {
    // 刷新当前页面
    router.refresh();
  };

  return (
    <>
      <div className="flex items-center gap-4">
        {/* <small>Pod 创建者提交了变更！</small> */}
        <AppBtn 
          btnProps={{
            size: "sm", 
            color: "success",
            onPress: handleApprove
          }}
        >
          通过
        </AppBtn>
        <AppBtn 
          btnProps={{
            size: "sm", 
            color: "danger",
            onPress: handleReject
          }}
        >
          拒绝
        </AppBtn>
      </div>

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
        milestones={podDetail?.milestones || []}
        currency={podCurrency}
        walletAddress={podWalletAddress}
        onSuccess={handleModalSuccess}
      />
    </>
  );
}