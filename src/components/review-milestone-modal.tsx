import { useState } from "react";
import { Button, Modal, ModalBody, ModalContent, ModalHeader, ModalFooter, Textarea, useDisclosure } from "@heroui/react";
import { api } from "~/trpc/react";

interface DeliveryInfo {
  content: string;
  links: Record<string, string>;
  submittedAt: string;
  approved: boolean | null;
  reviewComment: string | null;
  reviewedAt: string | null;
}

interface ReviewMilestoneModalProps {
  milestoneId: string | number;
  deliveryInfo: DeliveryInfo[];
  onReview?: (data: { action: 'approve' | 'reject'; comment: string }) => void;
}

export default function ReviewMilestoneModal({ milestoneId, deliveryInfo, onReview }: ReviewMilestoneModalProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reviewMilestoneDeliveryMutation = api.pod.reviewMilestoneDelivery.useMutation({
    onSuccess: () => {
      setComment("");
      onClose();
      
      // 调用父组件的回调
      onReview?.({ action: reviewAction, comment: comment.trim() });
      
      const actionText = reviewAction === 'approve' ? '通过' : '拒绝';
      alert(`Milestone审核${actionText}成功！`);
    },
    onError: (error) => {
      console.error("审核失败:", error);
      alert(`审核失败: ${error.message}`);
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

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
      // 找到最新的待审核的提交
      const latestPendingDeliveryIndex = deliveryInfo.findIndex(delivery => delivery.approved === null);
      
      await reviewMilestoneDeliveryMutation.mutateAsync({
        milestoneId: Number(milestoneId),
        deliveryIndex: latestPendingDeliveryIndex,
        approved: reviewAction === 'approve',
        comment: comment.trim(),
      });
    } catch (error) {
      // 错误处理在mutation的onError中
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  // 找到最新的待审核的提交
  const latestPendingDeliveryIndex = deliveryInfo.findIndex(delivery => delivery.approved === null);
  
  // 链接名称映射
  const linkNameMapping = {
    github: "GitHub链接",
    demo: "演示链接", 
    docs: "文档链接",
    website: "网站链接",
    video: "视频链接",
    other: "其他链接"
  };

  return (
    <>
      {/* 只有当有待审核的提交时才显示审核按钮 */}
      {latestPendingDeliveryIndex >= 0 && (
        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            color="danger" 
            variant="flat"
            onPress={() => handleOpenModal('reject')}
          >
            拒绝
          </Button>
          <Button 
            size="sm" 
            color="success" 
            variant="flat"
            onPress={() => handleOpenModal('approve')}
          >
            通过
          </Button>
        </div>
      )}
      
      <Modal 
        isOpen={isOpen} 
        onOpenChange={handleClose}
        placement="center"
        size="2xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader className="text-xl font-bold">
            {reviewAction === 'approve' ? '通过 Milestone' : '拒绝 Milestone'}
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Textarea
                variant="bordered"
                label={reviewAction === 'approve' ? '通过评价' : '拒绝理由'}
                placeholder={
                  reviewAction === 'approve' 
                    ? '请提供对完成工作的积极反馈...'
                    : '请说明拒绝的原因和需要改进的地方...'
                }
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                minRows={4}
                maxRows={8}
                isRequired
                description="您的审核评价将对申请者可见"
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
              取消
            </Button>
            <Button 
              color={reviewAction === 'approve' ? 'success' : 'danger'}
              onPress={handleSubmit}
              isLoading={isSubmitting}
            >
              {isSubmitting 
                ? '提交中...' 
                : reviewAction === 'approve' 
                  ? '确认通过' 
                  : '确认拒绝'
              }
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
} 