"use client";

import { useAccount } from "wagmi";
import AppBtn from "~/components/app-btn";
import { api } from "~/trpc/react";

interface GpReviewActionsProps {
  podStatus: string;
  grantsPoolId: number;
}

export default function GpReviewActions({ 
  podStatus, 
  grantsPoolId
}: GpReviewActionsProps) {
  const { address } = useAccount();

  // 查询 GP 详情获取所有者信息
  const { data: grantsPoolDetail } = api.grantsPool.getById.useQuery(
    { id: grantsPoolId },
    { enabled: !!grantsPoolId }
  );

  // 检查当前用户是否是 GP 创建者
  const isGpOwner = address && grantsPoolDetail?.owner?.walletAddress && 
    address.toLowerCase() === grantsPoolDetail.owner.walletAddress.toLowerCase();

  // 只有当 Pod 状态为 REVIEWING 且当前用户是 GP 创建者时才显示操作按钮
  if (podStatus !== 'REVIEWING' || !isGpOwner) {
    return null;
  }

  const handleApprove = () => {
    // TODO: 实现审批通过逻辑
    console.log("Pod 审批通过");
  };

  const handleReject = () => {
    // TODO: 实现审批拒绝逻辑
    console.log("Pod 审批拒绝");
  };

  return (
    <div className="flex items-center gap-2">
      <small>Pod 创建者提交了变更！</small>
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
  );
}