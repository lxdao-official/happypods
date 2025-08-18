"use client";

import { Alert } from "@heroui/react";
import AppBtn from "~/components/app-btn";
import { useState } from "react";
import type { Pod } from "@prisma/client";
import { toast } from "sonner";
import { api } from "~/trpc/react";
import { delay_s } from "~/lib/utils";
import { useConfirmModal } from "~/components/providers/confirm-provider";

interface PodMilestoneTimeoutActionsProps {
  pod: Pod & {
    grantsPool: { treasuryWallet: string };
    podTreasuryBalances: BigInt;
  };
}

export default function PodMilestoneTimeoutActions({pod}: PodMilestoneTimeoutActionsProps) {
  const { confirm } = useConfirmModal();

  // terminatePod mutation
  const terminatePodMutation = api.milestone.terminatePod.useMutation({
    onSuccess: async () => {
      toast.success('Pod terminated successfully!');
      await delay_s(2000);
      window.location.reload();
    },
    onError: (error) => {
      console.error("Terminate Pod failed:", error);
      toast.error(`Terminate Pod failed: ${error.message}`);  
    },
  });

  // 终止Pod
  const handleTerminatePod = async () => {
    try {
      await terminatePodMutation.mutateAsync({
        podId: pod.id
      });
    } catch (error) {
      console.error('Terminate Pod failed:', error);
      // 错误已经在 mutation 的 onError 中处理了
    }
  };

  // 显示确认弹窗
  const showTerminateConfirm = () => {
    confirm(
      handleTerminatePod,
      {
        title: "Confirm Terminate Pod",
        content: "After terminating the Pod, all uncompleted milestones will be canceled, and the funds will be returned to the GP treasury. This action cannot be undone, please confirm whether to continue?",
        confirmText: "Confirm Terminate",
        cancelText: "Cancel",
        confirmColor: "danger"
      }
    );
  };

  return (
    <>
      <Alert
        color="danger"
        variant="bordered"
        title="Milestone Delivery Timeout"
        className="mb-4"
        classNames={{base: 'bg-background'}}
        endContent={
          <div className="flex items-center gap-4">
            <AppBtn 
              btnProps={{
                size: "sm", 
                color: "danger",
                onPress: showTerminateConfirm
              }}
              >Terminate Pod</AppBtn>
          </div>
        }
      >
        <div className="space-y-1">
          <small className="text-secondary">If the Milestone delivery is overdue, please contact the Pod owner or terminate the Pod in time!</small>
        </div>
      </Alert>
    </>
  );
}
