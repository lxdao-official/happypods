"use client";

import { useState, useMemo } from "react";
import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Card, CardBody, Divider } from "@heroui/react";
import { api } from "~/trpc/react";
import { FEE_CONFIG } from "~/lib/config";

interface Milestone {
  id: number;
  title: string;
  amount: number;
  deadline: Date;
}

interface ApprovePodModalProps {
  isOpen: boolean;
  onClose: () => void;
  podId: number;
  podTitle: string;
  milestones: Milestone[];
  currency: string;
  walletAddress: string;
  onSuccess?: () => void;
}

export default function ApprovePodModal({
  isOpen,
  onClose,
  podId,
  podTitle,
  milestones,
  currency,
  walletAddress,
  onSuccess,
}: ApprovePodModalProps) {
  const [isTransferring, setIsTransferring] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  const approvePodMutation = api.pod.approve.useMutation({
    onSuccess: () => {
      onSuccess?.();
      handleClose();
    },
    onError: (error) => {
      console.error("通过Pod失败:", error);
      alert(`通过失败: ${error.message}`);
    },
    onSettled: () => {
      setIsApproving(false);
    },
  });

  // 计算总金额和手续费
  const financialInfo = useMemo(() => {
    const totalAmount = milestones.reduce((sum, milestone) => sum + milestone.amount, 0);
    const fee = Math.max(totalAmount * FEE_CONFIG.TRANSACTION_FEE_RATE, FEE_CONFIG.MIN_TRANSACTION_FEE);
    const totalWithFee = totalAmount + fee;

    return {
      totalAmount,
      fee,
      totalWithFee,
      feeRate: FEE_CONFIG.TRANSACTION_FEE_RATE * 100, // 转换为百分比
    };
  }, [milestones]);

  const handleClose = () => {
    setIsTransferring(false);
    setIsApproving(false);
    onClose();
  };

  const handleTransfer = async () => {
    setIsTransferring(true);
    
    // 模拟转账操作 - 2秒延迟
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsTransferring(false);
    
    // 转账完成后自动调用approve接口
    setIsApproving(true);
    try {
      await approvePodMutation.mutateAsync({
        id: podId,
      });
    } catch (error) {
      // 错误处理在mutation的onError中
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
            您即将通过 【{podTitle}】 的提案申请
        </ModalHeader>
        <ModalBody>
          <div className="space-y-6">
            <div>
              <p className="text-sm text-green-600">
                将 Grants Pool 内的资金转入 Pod 多签国库地址后，即可激活当前 Pod。
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
                      {financialInfo.totalAmount.toLocaleString()} {currency}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">
                      平台手续费 ({financialInfo.feeRate}%)
                    </span>
                    <span className="font-mono text-sm text-orange-600">
                      {financialInfo.fee.toLocaleString()} {currency}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">
                      Pod 多签国库地址
                    </span>
                    <span className="font-mono text-sm break-all">
                      {walletAddress}
                    </span>
                  </div>
                  <Divider />
                  <div className="flex justify-between font-semibold">
                    <span className="text-base">总计转账金额</span>
                    <span className="font-mono text-base text-green-600">
                      {financialInfo.totalWithFee.toLocaleString()} {currency}
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
            isDisabled={isTransferring || isApproving || milestones.length === 0}
          >
            {isTransferring ? "转账中..." : isApproving ? "更新状态中..." : "确认转账"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}