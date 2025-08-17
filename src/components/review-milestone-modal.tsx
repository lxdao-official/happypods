import { useState } from "react";
import { Button, Modal, ModalBody, ModalContent, ModalHeader, ModalFooter, Textarea, useDisclosure } from "@heroui/react";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { delay_s } from "~/lib/utils";
import useSafeWallet from "~/hooks/useSafeWallet";
import type { GrantsPoolTokens, Milestone, Pod } from "@prisma/client";

interface DeliveryInfo {
  content: string;
  links: Record<string, string>;
  submittedAt: string;
  approved: boolean | null;
  reviewComment: string | null;
  reviewedAt: string | null;
}

interface ReviewMilestoneModalProps {
  milestone: Milestone;
  onReview?: (data: { action: 'approve' | 'reject'; comment: string }) => void;
  podDetail: Pod & {grantsPool: {treasuryWallet:string}, podTreasuryBalances:BigInt};
}

export default function ReviewMilestoneModal({ milestone, podDetail, onReview }: ReviewMilestoneModalProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {deliveryInfo,id:milestoneId} = milestone;
  const {data: safeTransactionData} = api.milestone.getPaymentTransactionData.useQuery({milestoneId: Number(milestoneId)});

  const {getTransactionHash, proposeOrExecuteTransaction} = useSafeWallet();

  const reviewMilestoneDeliveryMutation = api.milestone.reviewMilestoneDelivery.useMutation({
    onSuccess: async() => {
      setComment("");
      onClose();
      // 调用父组件的回调
      onReview?.({ action: reviewAction, comment: comment.trim() });
      const actionText = reviewAction === 'approve' ? '通过' : '拒绝';
      toast.success(`Milestone审核${actionText}成功！`);
      await delay_s(2000);
      window.location.reload();
    },
    onError: (error) => {
      console.error("审核失败:", error);
      toast.error(`审核失败: ${error.message}`);  
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
      toast.error("请输入评价内容");
      return;
    }

    if(!safeTransactionData) return toast.error("safeTransactionData is null");
    const transactions = safeTransactionData.transactions.map(transaction => ({
      token: transaction.token,
      to: transaction.to,
      amount: transaction.amount
    })) as any;

    setIsSubmitting(true);

    const safeTransactionHash = await getTransactionHash(podDetail.walletAddress, transactions);
    
    try {

      let safeTxHash;
      // 审核通过，转账给用户
      if(isApproved && safeTransactionHash){
        const res = await proposeOrExecuteTransaction(podDetail.walletAddress, transactions);
        safeTxHash = res ? res.toString() : undefined;
      }

      // 最后一次审核失败，需要将资金退回给GP
      if(!isApproved && isLastReject){
        const res = await proposeOrExecuteTransaction(podDetail.walletAddress, [{
          token: podDetail.currency as GrantsPoolTokens,
          to: podDetail.grantsPool.treasuryWallet,
          amount: Number(podDetail.podTreasuryBalances).toString()
        }]);
        safeTxHash = res ? res.toString() : undefined;
      }

      console.log('safeTxHash==>',safeTxHash);

      await reviewMilestoneDeliveryMutation.mutateAsync({
        milestoneId: Number(milestoneId),
        approved: isApproved,
        comment: comment.trim(),
        safeTransactionHash: safeTxHash
      });
    } catch (error) {
      // 错误处理在mutation的onError中
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  // 找到最新的待审核的提交
  const latestPendingDeliveryIndex = deliveryInfo.findIndex((delivery: any) => !delivery?.approved);
  const isApproved = reviewAction === 'approve';

  // 最后一次的拒绝操作
  const isLastReject = deliveryInfo && deliveryInfo.length >= 3;
  

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
            {isApproved ? '通过 Milestone' : '拒绝 Milestone'}
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Textarea
                variant="bordered"
                label={isApproved ? '通过评价' : '拒绝理由'}
                placeholder={
                  isApproved 
                    ? '请提供对完成工作的积极反馈...'
                    : '请说明拒绝的原因和需要改进的地方...'
                }
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                minRows={4}
                maxRows={8}
                isRequired
              />

              <div className="text-xs text-secondary">
                {isApproved && '通过操作,将自动支付当前 Milestone 金额与平台手续费!'}
                {isLastReject && '这是最后一次拒绝机会,发起拒绝将关闭 Pod,并退回所有未使用的资金至 GP 多签国库, 请谨慎操作!'}
              </div>

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
              color={isApproved ? 'success' : 'danger'}
              onPress={handleSubmit}
              isLoading={isSubmitting}
            >
              {isSubmitting 
                ? '提交中...' 
                : isApproved 
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