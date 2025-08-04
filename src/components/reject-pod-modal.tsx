"use client";

import { useState } from "react";
import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Textarea } from "@heroui/react";
import { api } from "~/trpc/react";

interface RejectPodModalProps {
  isOpen: boolean;
  onClose: () => void;
  podId: number;
  podTitle: string;
  onSuccess?: () => void;
}

export default function RejectPodModal({
  isOpen,
  onClose,
  podId,
  podTitle,
  onSuccess,
}: RejectPodModalProps) {
  const [rejectReason, setRejectReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const rejectPodMutation = api.pod.reject.useMutation({
    onSuccess: () => {
      onSuccess?.();
      handleClose();
    },
    onError: (error) => {
      console.error("拒绝Pod失败:", error);
      alert(`拒绝失败: ${error.message}`);
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const handleClose = () => {
    setRejectReason("");
    setIsSubmitting(false);
    onClose();
  };

  const handleSubmit = async () => {
    if (!rejectReason.trim()) {
      alert("请输入拒绝理由");
      return;
    }

    setIsSubmitting(true);
    
    try {
      await rejectPodMutation.mutateAsync({
        id: podId,
        rejectReason: rejectReason.trim(),
      });
    } catch (error) {
      // 错误处理在mutation的onError中
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose}
      size="lg"
      scrollBehavior="inside"
      isDismissable={false}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
            您即将拒绝 【{podTitle}】 的提案申请
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            
            <div>
              <Textarea
                placeholder="请详细说明拒绝的原因，这将帮助申请者改进他们的提案..."
                value={rejectReason}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRejectReason(e.target.value)}
                minRows={4}
                maxRows={8}
                maxLength={1000}
                isInvalid={!rejectReason.trim() && rejectReason !== ""}
                errorMessage={!rejectReason.trim() && rejectReason !== "" ? "拒绝理由不能为空" : ""}
              />
              <p className="mt-1 text-xs text-gray-500">
                {rejectReason.length}/1000 字符
              </p>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button 
            color="default" 
            variant="light" 
            onPress={handleClose}
            isDisabled={isSubmitting}
          >
            取消
          </Button>
          <Button 
            color="danger" 
            onPress={handleSubmit}
            isLoading={isSubmitting}
            isDisabled={!rejectReason.trim()}
          >
            确认拒绝
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}