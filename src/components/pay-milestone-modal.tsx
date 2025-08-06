'use client';

import { useState } from 'react';
import { Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from '@heroui/react';
import { api } from '~/trpc/react';
import { useRouter } from 'next/navigation';
import { FEE_CONFIG } from '~/lib/config';
import EdgeLine from './edge-line';

interface PayMilestoneModalProps {
  milestoneId: number;
}

export default function PayMilestoneModal({ milestoneId }: PayMilestoneModalProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const router = useRouter();
  
  const { data: milestone } = api.milestone.getDetail.useQuery({ id: milestoneId });
  const confirmPaymentMutation = api.milestone.confirmPayment.useMutation({
    onSuccess: () => {
      onClose();
      router.refresh();
    },
  });

  const milestoneAmount = milestone?.amount || 0;
  const platformFee = milestoneAmount * FEE_CONFIG.TRANSACTION_FEE_RATE;
  const totalAmount = milestoneAmount + platformFee;

  const handleConfirmPayment = () => {
    confirmPaymentMutation.mutate({ milestoneId });
  };

  return (
    <>
      <Button 
        size="sm" 
        color="success" 
        variant="flat"
        onPress={onOpen}
      >
        国库转账
      </Button>
      
      <Modal isOpen={isOpen} onClose={onClose} size="md" placement="center">
        <ModalContent>
          <ModalHeader className="text-xl font-bold">
            确认支付
          </ModalHeader>
          <ModalBody className="pb-6">
            <p className="mb-4 text-xs text-default-600">
              请确认以下转账信息，完成多签转账后，将自动确认支付。
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Milestone 金额:</span>
                <span className="font-medium text-red-500">{milestoneAmount} {milestone?.pod?.currency}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">平台手续费 ({FEE_CONFIG.TRANSACTION_FEE_RATE*100}%):</span>
                <span className="font-medium text-green-500">{platformFee} {milestone?.pod?.currency}</span>
              </div>
              
              <EdgeLine color="#747474" />
              
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold">总计:</span>
                <span className="font-bold">{totalAmount} {milestone?.pod?.currency}</span>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose}>
              取消
            </Button>
            <Button 
              color="success"
              onPress={handleConfirmPayment}
              isLoading={confirmPaymentMutation.isPending}
            >
              {confirmPaymentMutation.isPending ? '处理中...' : '确认支付'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}