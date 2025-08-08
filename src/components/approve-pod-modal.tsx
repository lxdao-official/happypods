"use client";

import { useState, useMemo } from "react";
import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Card, CardBody, Divider } from "@heroui/react";
import { api } from "~/trpc/react";
import { FEE_CONFIG } from "~/lib/config";
import Decimal from "decimal.js";
import { toast } from "sonner";
import useSafeWallet from "~/app/hooks/useSafeWallet";
import type { GrantsPoolTokens, Milestone } from "@prisma/client";



interface ApprovePodModalProps {
  isOpen: boolean;
  onClose: () => void;
  podId: number;
  podTitle: string;
  appliedAmount: number;
  currency: string;
  walletAddress: string;
  treasuryWallet: string;
  onSuccess?: () => void;
  onlyTransfer: boolean;
}

export default function ApprovePodModal({
  isOpen,
  onClose,
  podId,
  podTitle,
  appliedAmount,
  currency,
  walletAddress,
  treasuryWallet,
  onSuccess,
  onlyTransfer,
}: ApprovePodModalProps) {
  const [isTransferring, setIsTransferring] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const {buildErc20TransfersSafeTransaction,signSafeTransaction,executeSafeTransaction,getTransactionHash} = useSafeWallet();

  const approvePodMutation = api.pod.approve.useMutation({
    onSuccess: () => {
      onSuccess?.();
      handleClose();
      toast.success('申请已通过，下一步请完成多签转账！');
    },
    onError: (error) => {
      console.error("通过Pod失败:", error);
      toast.error(`通过失败: ${error.message}`);
    },
    onSettled: () => {
      setIsApproving(false);
    },
  });

  // 计算总金额和手续费
  const financialInfo = useMemo(() => {
    const fee = Math.max(Decimal(appliedAmount).mul(FEE_CONFIG.TRANSACTION_FEE_RATE).toNumber(), FEE_CONFIG.MIN_TRANSACTION_FEE);
    const totalWithFee = Decimal(appliedAmount).plus(fee).toNumber(); 
    return {
      appliedAmount,
      fee,
      totalWithFee,
      feeRate: FEE_CONFIG.TRANSACTION_FEE_RATE * 100, // 转换为百分比
    };
  }, [appliedAmount]);

  const handleClose = () => {
    setIsTransferring(false);
    setIsApproving(false);
    onClose();
  };

  // 完成状态变成与转账操作
  const handleTransfer = async () => {
    try {
      // 状态变更
      if(!onlyTransfer){
        setIsApproving(true);
        await approvePodMutation.mutateAsync({id: podId});
        setIsApproving(false);
      }

      // 转账发起
      setIsTransferring(true);
      const safeTransaction = await buildErc20TransfersSafeTransaction(treasuryWallet, [{
        token: currency as GrantsPoolTokens,
        to: walletAddress,
        amount: financialInfo.totalWithFee.toString()
      }])
      console.log('safeTransaction', safeTransaction);

      const txHash = await getTransactionHash(treasuryWallet, safeTransaction);
      console.log('txHash', txHash);

      const sendTx = await executeSafeTransaction(treasuryWallet, safeTransaction);
      console.log('sendTx', sendTx);

      // const signSafeTxHash = await signSafeTransaction(treasuryWallet, safeTransaction);
      // console.log('signSafeTxHash', signSafeTxHash);
      
      setIsTransferring(false);
      onClose();
      
    } catch (error) {
      setIsApproving(false);
      setIsTransferring(false);
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose}
      size="2xl"
      scrollBehavior="inside"
      isDismissable={false}
      hideCloseButton={isTransferring || isApproving}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          {
            onlyTransfer ? `您即将向 【${podTitle}】 Pod 发起多签转账` : `您即将通过 【${podTitle}】 Pod 的申请`
          }
            
        </ModalHeader>
        <ModalBody>
          <div className="space-y-6">
            <div>
              <p className="text-sm text-green-600">
                将 Pod 的申请资金 + 平台手续费，通过GP国库转入 Pod 多签国库后，即可激活当前 Pod。
              </p>
            </div>
            
            {/* 费用明细 */}
            <Card className="border border-gray-800">
              <CardBody className="space-y-3 overflow-hidden">
                <h4 className="text-sm font-semibold">费用明细</h4>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm">里程碑总额</span>
                    <span className="font-mono text-sm">
                      {financialInfo.appliedAmount} {currency}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">
                      平台手续费 ({financialInfo.feeRate}%)
                    </span>
                    <span className="font-mono text-sm text-orange-600">
                      {financialInfo.fee} {currency}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">
                      GP 多签国库 (转出)
                    </span>
                    <span className="font-mono text-sm break-all">
                      {treasuryWallet}
                    </span>
                  </div>
                  
                  {/* <div className="flex"><i className="text-2xl text-green-500 ri-arrow-down-box-line"></i></div> */}

                  <div className="flex justify-between">
                    <span className="text-sm">
                      Pod 多签国库 (接收)
                    </span>
                    <span className="font-mono text-sm break-all">
                      {walletAddress}
                    </span>
                  </div>
                  <Divider />
                  <div className="flex justify-between font-semibold">
                    <span className="text-base">总计转账金额</span>
                    <span className="font-mono text-base text-green-600">
                      {financialInfo.totalWithFee} {currency}
                    </span>
                  </div>
                </div>
              </CardBody>
            </Card>
            
          </div>
        </ModalBody>
        <ModalFooter>
          <Button 
            color="default" 
            variant="light" 
            onPress={handleClose}
            isDisabled={isTransferring || isApproving}
          >
            取消
          </Button>
          <Button 
            color="success" 
            onPress={handleTransfer}
            isLoading={isTransferring || isApproving}
            isDisabled={isTransferring || isApproving || appliedAmount === 0}
          >
            {isTransferring ? "转账中..." : isApproving ? "更新状态中..." : onlyTransfer ? "发起多签转账" : "确认通过，并发起多签转账"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}