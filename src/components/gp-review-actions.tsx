"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AppBtn from "~/components/app-btn";
import RejectPodModal from "~/components/reject-pod-modal";
import ApprovePodModal from "~/components/approve-pod-modal";
import { PodStatus, type Milestone, type Pod } from "@prisma/client";
import { Alert } from "@heroui/react";


export default function GpReviewActions({ podDetail }: {podDetail: Pod}) {
  const {status:podStatus, id:podId, title:podTitle} = podDetail as any;
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
          variant="faded"
          color="default"
          title="Pod applied, please review!"
          className="mb-4 bg-background border border-gray-200"
          endContent={
            <div className="flex items-center gap-4">
              <AppBtn
                btnProps={{ size: "sm", color: "danger", onPress: handleReject }}
              >
                Reject
              </AppBtn>
              <AppBtn
                btnProps={{ size: "sm", color: "success", onPress: handleApprove }}
              >
                Approve
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
        podDetail={podDetail}
      />
    </>
  );
}