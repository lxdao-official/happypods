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
      console.error("Failed to reject Pod:", error);
      alert(`Failed to reject: ${error.message}`);
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
      alert("Please enter a reason for rejection");
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
      size="3xl"
      scrollBehavior="inside"
      isDismissable={false}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
            You are about to reject the proposal application for [{podTitle}]
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            
            <div>
              <Textarea
                placeholder="Please explain the reason for rejection in detail, this will help the applicant to improve their proposal..."
                value={rejectReason}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRejectReason(e.target.value)}
                minRows={4}
                maxRows={8}
                maxLength={1000}
                isInvalid={!rejectReason.trim() && rejectReason !== ""}
                errorMessage={!rejectReason.trim() && rejectReason !== "" ? "Reason for rejection cannot be empty" : ""}
              />
              <p className="mt-1 text-xs text-gray-500">
                {rejectReason.length}/1000 characters
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
            Cancel
          </Button>
          <Button 
            color="danger" 
            onPress={handleSubmit}
            isLoading={isSubmitting}
            isDisabled={!rejectReason.trim()}
          >
            Confirm Rejection
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}