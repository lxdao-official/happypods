"use client";

import { Alert } from "@heroui/react";
import AppBtn from "~/components/app-btn";
import Link from "next/link";
import type { Pod } from "@prisma/client";
import useSafeWallet from "~/app/hooks/useSafeWallet";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import useStore from "~/store";

interface PodRejectedActionsProps {
  pod: Pod;
}

export default function PodRejectedActions({pod}: PodRejectedActionsProps) {
  const {userInfo} = useStore();
  const [confirmations, setConfirmations] = useState<string[]>([]);

  const {getTransactionDetail,executeSafeTransactionByHash} = useSafeWallet();

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
    if(!userInfo?.walletAddress || !confirmations.length) return true;
    return confirmations.includes(userInfo?.walletAddress.toLowerCase());
  },[confirmations,userInfo]);

  const refund = async () => {
    if (!pod.walletAddress || !pod.refundSafeTransactionHash) throw new Error('退款失败');
    await executeSafeTransactionByHash(pod.walletAddress, pod.refundSafeTransactionHash);
    toast.success('退款成功');
  }


  return (
    <Alert
      color="warning"
      variant="bordered"
      title="Pod已被终止，请完成退款操作"
      className="mb-4"
      classNames={{base: 'bg-background'}}
      endContent={
        <div className="flex items-center gap-4">
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
          <Link href={`https://app.safe.global/transactions/tx?safe=oeth:${pod.walletAddress}&id=multisig_${pod.walletAddress}_${pod.refundSafeTransactionHash}`} target="_blank">
            <AppBtn btnProps={{color: "default", size: "sm", variant: "bordered"}}>
              <div className="flex gap-2">
                <span>交易详情</span>
                <i className="ri-external-link-line"></i>
              </div>
            </AppBtn>
          </Link>
        </div>
      }
    >
      <div className="space-y-1">
        <small className="text-secondary">请将国库余额退回到 GP 多签钱包！</small>
      </div>
    </Alert>
  );
}
