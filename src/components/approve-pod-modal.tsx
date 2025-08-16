"use client";

import { useState, useMemo } from "react";
import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Card, CardBody, Divider } from "@heroui/react";
import { api } from "~/trpc/react";
import { FEE_CONFIG } from "~/lib/config";
import Decimal from "decimal.js";
import { toast } from "sonner";
import useSafeWallet from "~/app/hooks/useSafeWallet";
import type { GrantsPoolTokens, Milestone } from "@prisma/client";
import { delay_s } from "~/lib/utils";



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
}

export default function ApprovePodModal({
  isOpen,
  onClose,
  podId,
  podTitle,
  appliedAmount,
  currency,
  walletAddress,
  treasuryWallet
}: ApprovePodModalProps) {
  const [isTransferring, setIsTransferring] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const {buildErc20TransfersSafeTransaction, getTransactionHash} = useSafeWallet();
  const {mutateAsync:approvePod} = api.pod.approve.useMutation();


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
      // 转账发起
      setIsTransferring(true);

      // 构建两笔交易
      const safeTransaction = await buildErc20TransfersSafeTransaction(treasuryWallet, [{
        token: currency as GrantsPoolTokens,
        to: walletAddress,
        amount: financialInfo.totalWithFee.toString()
      }])
      console.log('safeTransaction', safeTransaction);

      const transactionHash = await getTransactionHash(treasuryWallet, safeTransaction, true);
      console.log('txHash', transactionHash);

      await approvePod({id: podId, transactionHash});
      
      setIsTransferring(false);
      onClose();
      
      await delay_s(2000);
      window.location.reload();

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
        <ModalHeader className="flex flex-col gap-1">您即将通过 【${podTitle}】 Pod 的申请</ModalHeader>
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
            {isTransferring || isApproving ? "loading..." : "确认通过，并发起多签转账"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}