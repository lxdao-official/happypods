"use client";

import { Alert } from "@heroui/react";
import AppBtn from "~/components/app-btn";
import { useState } from "react";
import type { Pod } from "@prisma/client";
import { toast } from "sonner";
import { api } from "~/trpc/react";
import { delay_s } from "~/lib/utils";

interface PodMilestoneTimeoutActionsProps {
  pod: Pod & {
    grantsPool: { treasuryWallet: string };
    podTreasuryBalances: BigInt;
  };
}

export default function PodMilestoneTimeoutActions({pod}: PodMilestoneTimeoutActionsProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // terminatePod mutation
  const terminatePodMutation = api.milestone.terminatePod.useMutation({
    onSuccess: async () => {
      toast.success('Pod终止成功！');
      await delay_s(2000);
      window.location.reload();
    },
    onError: (error) => {
      console.error("终止Pod失败:", error);
      toast.error(`终止Pod失败: ${error.message}`);  
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  // 终止Pod
  const handleTerminatePod = async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      await terminatePodMutation.mutateAsync({
        podId: pod.id
      });
    } catch (error) {
      console.error('终止Pod失败:', error);
      setIsSubmitting(false);
    }
  };

  return (
    <Alert
      color="warning"
      variant="bordered"
      title="Milestone 交付超时"
      className="mb-4"
      classNames={{base: 'bg-background'}}
      endContent={
        <div className="flex items-center gap-4">
          <AppBtn 
            btnProps={{
              size: "sm", 
              color: "warning",
              onPress: handleTerminatePod,
              isLoading: isSubmitting,
              isDisabled: isSubmitting
            }}
            >终止 Pod</AppBtn>
        </div>
      }
    >
      <div className="space-y-1">
        <small className="text-secondary">若 Milestone 交付超时，请及时联系 Pod owner 或终止 Pod！</small>
      </div>
    </Alert>
  );
}
