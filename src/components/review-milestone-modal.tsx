import { useState } from "react";
import { Button, Modal, ModalBody, ModalContent, ModalHeader, ModalFooter, Textarea, useDisclosure } from "@heroui/react";

interface ReviewMilestoneModalProps {
  milestoneId: string | number;
  onReview?: (data: { action: 'approve' | 'reject'; comment: string }) => void;
}

export default function ReviewMilestoneModal({ milestoneId, onReview }: ReviewMilestoneModalProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenModal = (action: 'approve' | 'reject') => {
    setReviewAction(action);
    setComment("");
    onOpen();
  };

  const handleSubmit = async () => {
    if (!comment.trim()) {
      alert("请输入评价内容");
      return;
    }

    setIsSubmitting(true);
    try {
      // 模拟提交
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onReview?.({ action: reviewAction, comment: comment.trim() });
      
      setComment("");
      onClose();
      
      const actionText = reviewAction === 'approve' ? '通过' : '拒绝';
      alert(`Milestone审核${actionText}成功！`);
    } catch (error) {
      alert("提交失败，请重试");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <Button 
          size="sm" 
          color="danger" 
          variant="flat"
          onPress={() => handleOpenModal('reject')}
        >
          Review Rejected
        </Button>
        <Button 
          size="sm" 
          color="success" 
          variant="flat"
          onPress={() => handleOpenModal('approve')}
        >
          Review Passed
        </Button>
      </div>
      
      <Modal 
        isOpen={isOpen} 
        onOpenChange={handleClose}
        placement="center"
        size="2xl"
      >
        <ModalContent>
          <ModalHeader className="text-xl font-bold">
            {reviewAction === 'approve' ? 'Approve Milestone' : 'Reject Milestone'}
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <div className={`p-4 rounded-lg border ${
                reviewAction === 'approve' 
                  ? 'bg-green-50 border-green-500' 
                  : 'bg-red-50 border-red-500'
              }`}>
                <div className="flex items-start gap-3">
                  <i className={`text-xl mt-0.5 ${
                    reviewAction === 'approve' 
                      ? 'ri-checkbox-circle-line text-green-500' 
                      : 'ri-close-circle-line text-red-500'
                  }`}></i>
                  <div>
                    <h3 className={`font-semibold mb-2 ${
                      reviewAction === 'approve' ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {reviewAction === 'approve' ? 'Approve This Milestone' : 'Reject This Milestone'}
                    </h3>
                    <p className={`text-sm leading-relaxed ${
                      reviewAction === 'approve' ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {reviewAction === 'approve' 
                        ? 'Please provide positive feedback and confirmation of milestone completion.'
                        : 'Please provide clear reasons for rejection and suggestions for improvement.'
                      }
                    </p>
                  </div>
                </div>
              </div>

              <Textarea
                variant="bordered"
                label={reviewAction === 'approve' ? 'Approval Comments' : 'Rejection Reasons'}
                placeholder={
                  reviewAction === 'approve' 
                    ? 'Provide feedback on what was done well and confirm milestone completion...'
                    : 'Explain why this milestone is being rejected and what needs to be improved...'
                }
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                minRows={4}
                maxRows={8}
                isRequired
                description="Your review will be visible to the milestone submitter"
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button 
              color="default" 
              variant="bordered" 
              onPress={handleClose}
              isDisabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              color={reviewAction === 'approve' ? 'success' : 'danger'}
              onPress={handleSubmit}
              isLoading={isSubmitting}
            >
              {isSubmitting 
                ? 'Submitting...' 
                : reviewAction === 'approve' 
                  ? 'Approve Milestone' 
                  : 'Reject Milestone'
              }
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
} 