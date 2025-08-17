"use client";

import { useState, useMemo } from "react";
import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Card, CardBody, Divider } from "@heroui/react";
import { api } from "~/trpc/react";
import { FEE_CONFIG } from "~/lib/config";
import Decimal from "decimal.js";
import { toast } from "sonner";
import useSafeWallet from "~/hooks/useSafeWallet";
import type { GrantsPoolTokens, Milestone, Pod } from "@prisma/client";
import { delay_s, formatToken } from "~/lib/utils";



interface ApprovePodModalProps {
  isOpen: boolean;
  onClose: () => void;
  podDetail: Pod;
  onSuccess?: () => void;
}

export default function ApprovePodModal({
  isOpen,
  onClose,
  podDetail
}: ApprovePodModalProps) {
  const [isTransferring, setIsTransferring] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const {getTransactionHash, proposeOrExecuteTransaction} = useSafeWallet();
  const {mutateAsync:approvePod} = api.pod.approve.useMutation();
  const {id:podId, title:podTitle, appliedAmount, currency, walletAddress, grantsPool:{treasuryWallet} } = podDetail as any;

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
      const safeTransaction =[{
        token: currency as GrantsPoolTokens,
        to: walletAddress,
        amount: financialInfo.totalWithFee.toString()
      }]
      console.log('safeTransaction', safeTransaction);

      // const {safeTxHash} = await getTransactionHash(treasuryWallet, safeTransaction);
      // console.log('txHash', safeTxHash);
      await proposeOrExecuteTransaction(treasuryWallet, safeTransaction);

      await approvePod({id: podId});
      
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
        <ModalHeader className="flex flex-col gap-1">You are about to approve the application for the 【${podTitle}】 Pod</ModalHeader>
        <ModalBody>
          <div className="space-y-6">
            <div>
              <p className="text-sm text-green-600">
                After transferring the Pod's application funds + platform fees from the GP treasury to the Pod multi-sig treasury, the current Pod can be activated.
              </p>
            </div>
            
            {/* 费用明细 */}
            <Card className="border border-gray-800">
              <CardBody className="space-y-3 overflow-hidden">
                <h4 className="text-sm font-semibold">Fee Details</h4>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm">Total Milestone Amount</span>
                    <span className="font-mono text-sm">
                      {formatToken(financialInfo.appliedAmount)} {currency}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">
                      Platform Fee ({financialInfo.feeRate}%)
                    </span>
                    <span className="font-mono text-sm text-orange-600">
                      {formatToken(financialInfo.fee)} {currency}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">
                      GP Multi-sig Treasury (Transfer out)
                    </span>
                    <span className="font-mono text-sm break-all">
                      {treasuryWallet}
                    </span>
                  </div>
                  
                  {/* <div className="flex"><i className="text-2xl text-green-500 ri-arrow-down-box-line"></i></div> */}

                  <div className="flex justify-between">
                    <span className="text-sm">
                      Pod Multi-sig Treasury (Receive)
                    </span>
                    <span className="font-mono text-sm break-all">
                      {walletAddress}
                    </span>
                  </div>
                  <Divider />
                  <div className="flex justify-between font-semibold">
                    <span className="text-base">Total Transfer Amount</span>
                    <span className="font-mono text-base text-green-600">
                      {formatToken(financialInfo.totalWithFee)} {currency}
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
            Cancel
          </Button>
          <Button 
            color="success" 
            onPress={handleTransfer}
            isLoading={isTransferring || isApproving}
            isDisabled={isTransferring || isApproving || appliedAmount === 0}
          >
            {isTransferring || isApproving ? "loading..." : "Confirm Approval and Initiate Multi-sig Transfer"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}