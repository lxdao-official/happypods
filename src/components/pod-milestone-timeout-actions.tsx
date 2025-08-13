"use client";

import { Alert } from "@heroui/react";
import AppBtn from "~/components/app-btn";
import Link from "next/link";
import type { Pod, GrantsPoolTokens } from "@prisma/client";
import useSafeWallet from "~/app/hooks/useSafeWallet";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import useStore from "~/store";
import { api } from "~/trpc/react";
import { delay_s } from "~/lib/utils";

interface PodMilestoneTimeoutActionsProps {
  pod: Pod & {
    grantsPool: { treasuryWallet: string };
    podTreasuryBalances: BigInt;
  };
}

export default function PodMilestoneTimeoutActions({pod}: PodMilestoneTimeoutActionsProps) {
  const {userInfo} = useStore();
  const [confirmations, setConfirmations] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {getTransactionDetail, executeSafeTransactionByHash, buildAndExecuteSafeTransaction} = useSafeWallet();

  // 新增：initiatePodRefund mutation
  const initiatePodRefundMutation = api.milestone.initiatePodRefund.useMutation({
    onSuccess: async () => {
      toast.success('退款发起成功！');
      await delay_s(2000);
      window.location.reload();
    },
    onError: (error) => {
      console.error("发起退款失败:", error);
      toast.error(`发起退款失败: ${error.message}`);  
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const getTxData = async () => {
    if (pod.refundSafeTransactionHash) {
      const transaction = await getTransactionDetail(pod.refundSafeTransactionHash);
      console.log('transaction==?',transaction);
      setConfirmations(transaction.confirmations?.map(item=>item.owner.toLowerCase()) || []);
    }
  }

  useEffect(() => {
    getTxData()
  }, [pod.refundSafeTransactionHash]);

  // 只显示未确认的按钮
  const isConfirmed = useMemo(()=>{
    if(!userInfo?.walletAddress) return false;
    return confirmations.includes(userInfo?.walletAddress.toLowerCase());
  },[confirmations,userInfo]);

  const refund = async () => {
    if (!pod.walletAddress || !pod.refundSafeTransactionHash) throw new Error('退款失败');
    await executeSafeTransactionByHash(pod.walletAddress, pod.refundSafeTransactionHash);
    toast.success('退款成功');
  }
  

  // 发起退款多签提案
  const proposeRefund = async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      // 构建并执行Safe交易，类似review-milestone-modal的实现
      const res = await buildAndExecuteSafeTransaction(pod.walletAddress, [{
        token: pod.currency as GrantsPoolTokens,
        to: pod.grantsPool.treasuryWallet,
        amount: Number(pod.podTreasuryBalances).toString()
      }]);
      
      // 调用后端接口，传入podId和退款交易hash
      await initiatePodRefundMutation.mutateAsync({
        podId: pod.id,
        refundSafeTransactionHash: res.safeTxHash
      });
    } catch (error) {
      console.error('发起退款失败:', error);
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
          
          {
            pod.refundSafeTransactionHash &&
              <AppBtn 
                btnProps={{
                  size: "sm", 
                  color: "warning",
                  onPress: proposeRefund,
                  isLoading: isSubmitting,
                  isDisabled: isSubmitting
                }}
                >发起退款多签</AppBtn>
          }
          
          {
            !isConfirmed &&
              <AppBtn 
                btnProps={{
                  size: "sm", 
                  color: "warning",
                  onPress: refund
                }}
                > 确认退款</AppBtn>
          }
          {
            pod.refundSafeTransactionHash &&
              <Link href={`https://app.safe.global/transactions/tx?safe=oeth:${pod.walletAddress}&id=multisig_${pod.walletAddress}_${pod.refundSafeTransactionHash}`} target="_blank">
                <AppBtn btnProps={{color: "default", size: "sm", variant: "bordered"}}>
                  <div className="flex gap-2">
                    <span>交易详情</span>
                    <i className="ri-external-link-line"></i>
                  </div>
                </AppBtn>
              </Link>
          }
        </div>
      }
    >
      <div className="space-y-1">
        <small className="text-secondary">若 Milestone 交付超时，您可以终止 Pod 并发起资金退回多签交易！</small>
      </div>
    </Alert>
  );
}
