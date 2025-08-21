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
  const {proposeOrExecuteTransaction} = useSafeWallet();
  const {mutateAsync:approvePod} = api.pod.approve.useMutation();
  const {id:podId, title:podTitle, appliedAmount, currency, walletAddress, grantsPool:{treasuryWallet} } = podDetail as any;

  // 计算总金额和手续费
  const financialInfo = useMemo(() => {
    const fee = Decimal(appliedAmount).mul(FEE_CONFIG.TRANSACTION_FEE_RATE).toNumber();
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

      // const {safeTxHash} = await getTransactionHash(treasuryWallet, safeTransaction);
      // console.log('txHash', safeTxHash);
      // const safeTxHash = await proposeOrExecuteTransaction(treasuryWallet, safeTransaction);
      // console.log('txHash', safeTxHash);

      // if(!safeTxHash) return;
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
      size="3xl"
      scrollBehavior="inside"
      isDismissable={false}
      hideCloseButton={isTransferring || isApproving}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">You are about to approve the application for the [ {podTitle} ] Pod</ModalHeader>
        <ModalBody>
          <div className="space-y-6">
            <div>
              <p className="text-sm text-green-600">
                Please complete the transfer from the GP multi-signature wallet to the Pod multi-signature wallet after approval, and the current Pod can be activated.
              </p>
            </div>
            
            {/* 费用明细 */}
            <Card className="border border-gray-800">
              <CardBody className="space-y-3 overflow-hidden">
                <h4 className="text-sm font-semibold">Transfer Details</h4>
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
                      GP Treasury (From)
                    </span>
                    <span className="font-mono text-sm break-all">
                      {treasuryWallet}
                    </span>
                  </div>
                  
                  {/* <div className="flex"><i className="text-2xl text-green-500 ri-arrow-down-box-line"></i></div> */}

                  <div className="flex justify-between">
                    <span className="text-sm">
                      Pod Treasury (To)
                    </span>
                    <span className="font-mono text-sm break-all">
                      {walletAddress}
                    </span>
                  </div>
                  <Divider />
                  <div className="flex justify-between font-semibold">
                    <span className="text-base">Total Amount</span>
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
            {isTransferring || isApproving ? "loading..." : "Approval"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}