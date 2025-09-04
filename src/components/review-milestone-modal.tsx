import { useState } from "react";
import { Button, Modal, ModalBody, ModalContent, ModalHeader, ModalFooter, Textarea, useDisclosure } from "@heroui/react";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { delay_s, withRetry, formatToken } from "~/lib/utils";
import useSafeWallet from "~/hooks/useSafeWallet";
import type { GrantsPoolTokens, Milestone, Pod } from "@prisma/client";
import useStore, { SafeTransactionStep, SafeStepStatus } from "~/store";
import { buildMetaTransactionData, buildNestedMultisigApprovalTransaction } from "~/lib/safeUtils";

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
  podDetail: Pod & { grantsPool: { treasuryWallet: string }, podTreasuryBalances: bigint };
}

export default function ReviewMilestoneModal({ milestone, podDetail, onReview }: ReviewMilestoneModalProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { deliveryInfo, id: milestoneId } = milestone;
  const { data: safeTransactionData } = api.milestone.getPaymentTransactionData.useQuery({ milestoneId: Number(milestoneId) });

  const { isReady: safeWalletReady, getTransactionDetail } = useSafeWallet();
  const { setSafeTransactionHandler, clearSafeTransactionHandler, setPodDetailRefreshKey } = useStore();

  // 构建里程碑付款的 MetaTransactionData
  const buildMilestonePaymentTransfers = () => {
    if (!safeTransactionData?.transactions) return [];

    return safeTransactionData.transactions.sort((a, b) => a.to.localeCompare(b.to)).map(transaction =>
      buildMetaTransactionData(
        transaction.token as GrantsPoolTokens,
        transaction.to,
        transaction.amount
      )
    );
  };

  const reviewMilestoneDeliveryMutation = api.milestone.reviewMilestoneDelivery.useMutation({
    onSuccess: async () => {
      setComment("");
      onClose();
      // 调用父组件的回调
      onReview?.({ action: reviewAction, comment: comment.trim() });
      toast.success(`Milestone review successfully!`);
      await delay_s(2000);
      setPodDetailRefreshKey();
    },
    onError: (error) => {
      console.error("Review failed:", error);
      toast.error(`Review failed: ${error.message}`);
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
      toast.error("Please enter your review");
      return;
    }

    if (!safeTransactionData) {
      toast.error("Transaction data not available");
      return;
    }

    // 如果是拒绝，直接调用API，不需要处理SafeWallet交易
    setIsSubmitting(true);
    if (!isApproved) {
      try {
        await reviewMilestoneDeliveryMutation.mutateAsync({
          milestoneId: Number(milestoneId),
          approved: false,
          comment: comment.trim(),
          safeTransactionHash: undefined
        });
      } catch (error) {
        console.error(error);
        setIsSubmitting(false);
      }
      return;
    }

    // 审核通过的情况 - 需要执行两步嵌套多签
    if (!milestone.safeTransactionHash) {
      toast.error("Original transaction hash not found");
      return;
    }

    // 如果交易阈值已经达到，则直接到第二步
    const transactionInfo = await getTransactionDetail(milestone.safeTransactionHash)
    if (
      transactionInfo &&
      transactionInfo.confirmations &&
      transactionInfo.confirmations.length >= transactionInfo.confirmationsRequired &&
      !transactionInfo.isExecuted
    ) {
      await triggerPodPaymentExecution();
      return;
    }

    try {
      // 构建第一步：GP钱包确认Pod钱包交易的approveHash交易
      const approvalTransfers = buildNestedMultisigApprovalTransaction(
        podDetail.walletAddress,           // Pod 钱包地址
        milestone.safeTransactionHash,    // Pod 钱包的交易 hash
        podDetail.grantsPool.treasuryWallet  // GP 钱包地址
      );

      // 构建交易描述
      const getApprovalDescription = () => (
        <div className="space-y-3">
          <div className="p-3 border rounded-lg bg-primary/5 border-primary/10">
            <h4 className="mb-2 font-medium text-primary">GP Wallet Approval Details</h4>
            <div className="space-y-1 text-small">
              <div className="flex justify-between">
                <span>Milestone Amount:</span>
                <span className="font-mono text-primary">{formatToken(safeTransactionData.milestoneAmount)} {safeTransactionData.currency}</span>
              </div>
              <div className="flex justify-between">
                <span>Platform Fee:</span>
                <span className="font-mono text-tiny">{formatToken(safeTransactionData.fee)} {safeTransactionData.currency}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Amount:</span>
                <span className="font-mono font-semibold text-primary">{formatToken(safeTransactionData.totalAmount)} {safeTransactionData.currency}</span>
              </div>
              <div className="flex justify-between">
                <span>Pod Wallet:</span>
                <span className="font-mono text-tiny">{podDetail.walletAddress.slice(0, 6)}...{podDetail.walletAddress.slice(-4)}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-tiny text-primary">
            <i className="ri-shield-check-line"></i>
            <span>Step 1: GP multi-sig approves Pod payment transaction</span>
          </div>
        </div>
      );

      // 触发第一步：GP钱包的确认交易
      setSafeTransactionHandler({
        safeAddress: podDetail.grantsPool.treasuryWallet,
        transfers: approvalTransfers,
        title: 'Milestone Review - GP Approval',
        description: getApprovalDescription(),

        onClose: () => {
          setIsSubmitting(false);
        },

        onStepChange: async (step, status, data, error) => {
          console.log('Approval step change:', { step, status, data, error });

          // 当 GP 钱包的确认交易执行完成后，触发第二步
          if (step === SafeTransactionStep.EXECUTION && status === SafeStepStatus.SUCCESS) {
            try {
              toast.info('GP approval completed, executing milestone payment...');
              clearSafeTransactionHandler();

              // 等待一段时间确保交易状态同步
              await delay_s(3000);

              // 触发第二步：执行Pod钱包的原始付款交易
              await triggerPodPaymentExecution();

            } catch (error) {
              console.error('Failed to trigger payment execution:', error);
              toast.error('Payment execution failed, please retry');
              setIsSubmitting(false);
            }
          }

          // 处理错误状态
          if (status === SafeStepStatus.ERROR && error) {
            console.error('Approval transaction failed:', error, 'at step:', step);
            toast.error(`❌ GP approval failed at ${step}: ${error.message}`);
            setIsSubmitting(false);
          }
        }
      });

    } catch (error) {
      console.error("Review submission failed:", error);
      toast.error("Review submission failed, please try again!");
      setIsSubmitting(false);
    }
  };

  // 第二步：执行Pod钱包的付款交易
  const triggerPodPaymentExecution = async () => {
    if (!safeTransactionData) {
      throw new Error("Transaction data not available");
    }

    const paymentTransfers = buildMilestonePaymentTransfers();
    if (paymentTransfers.length === 0) {
      throw new Error("No payment data to process");
    }

    // 构建付款交易描述
    const getPaymentDescription = () => (
      <div className="space-y-3">
        <div className="p-3 border rounded-lg bg-success/5 border-success/10">
          <h4 className="mb-2 font-medium text-success">Milestone Payment Execution</h4>
          <div className="space-y-1 text-small">
            <div className="flex justify-between">
              <span>Milestone Amount:</span>
              <span className="font-mono text-success">{formatToken(safeTransactionData.milestoneAmount)} {safeTransactionData.currency}</span>
            </div>
            <div className="flex justify-between">
              <span>Platform Fee:</span>
              <span className="font-mono text-tiny">{formatToken(safeTransactionData.fee)} {safeTransactionData.currency}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Amount:</span>
              <span className="font-mono font-semibold text-success">{formatToken(safeTransactionData.totalAmount)} {safeTransactionData.currency}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-tiny text-success">
          <i className="ri-money-dollar-circle-line"></i>
          <span>Step 2: Pod wallet executes payment transaction</span>
        </div>
      </div>
    );

    setSafeTransactionHandler({
      safeAddress: podDetail.walletAddress,
      transfers: paymentTransfers,
      title: 'Milestone Review - Payment Execution',
      description: getPaymentDescription(),

      onClose: () => {
        setIsSubmitting(false);
      },

      onStepChange: async (step, status, data, error) => {
        console.log('Payment step change:', { step, status, data, error });

        // 当付款交易执行完成后，调用审核API
        if (step === SafeTransactionStep.EXECUTION && status === SafeStepStatus.SUCCESS) {
          try {
            toast.info('Payment executed successfully, submitting review result...');

            setIsSubmitting(true);
            clearSafeTransactionHandler();

            const transactionHash = data?.transactionHash || milestone.safeTransactionHash;

            await delay_s(2000);
            
            // 调用审核API
            await reviewMilestoneDeliveryMutation.mutateAsync({
              milestoneId: Number(milestoneId),
              approved: true,
              comment: comment.trim(),
              safeTransactionHash: transactionHash
            });

          } catch (submitError) {
            console.error('Review submission failed:', submitError);
            toast.error('Review submission failed, please retry');
            setIsSubmitting(false);
          }
        }

        // 处理错误状态
        if (status === SafeStepStatus.ERROR && error) {
          console.error('Payment transaction failed:', error, 'at step:', step);
          toast.error(`❌ Payment failed at ${step}: ${error.message}`);
          setIsSubmitting(false);
        }
      }
    });
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
            Reject
          </Button>
          <Button
            size="sm"
            color="success"
            variant="flat"
            onPress={() => handleOpenModal('approve')}
          >
            Approve
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
            {isApproved ? 'Approve Milestone' : 'Reject Milestone'}
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Textarea
                variant="bordered"
                label={isApproved ? 'Approve Review' : 'Reason for Rejection'}
                placeholder={
                  isApproved
                    ? 'Please provide positive feedback on the completed work...'
                    : 'Please explain the reason for rejection and areas for improvement...'
                }
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                minRows={4}
                maxRows={8}
                isRequired
                errorMessage="Please enter your review"
              />

              <div className="text-xs text-secondary">
                {isApproved && 'Approving will automatically pay the current Milestone amount and platform fees!'}
                {isLastReject && 'This is the last chance to reject. Rejecting will close the Pod and return all unused funds to the GP multi-sig treasury. Please proceed with caution!'}
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
              Cancel
            </Button>
            <Button
              color={isApproved ? 'success' : 'danger'}
              onPress={handleSubmit}
              isLoading={isSubmitting}
              isDisabled={!safeWalletReady || !safeTransactionData}
            >
              {isSubmitting
                ? 'Submitting...'
                : isApproved
                  ? 'Confirm Approve'
                  : 'Confirm Reject'
              }
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
} 