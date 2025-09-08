import { useState } from "react";
import { Button, Modal, ModalBody, ModalContent, ModalHeader, ModalFooter, useDisclosure } from "@heroui/react";
import RelatedLinksSection from "./related-links-section";
import { MarkdownEditor } from "~/components/Tiptap";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { delay_s, formatToken } from "~/lib/utils";
import useSafeWallet from "~/hooks/useSafeWallet";
import { buildMetaTransactionData } from "~/lib/safeUtils";
import useStore, { SafeTransactionStep, SafeStepStatus } from "~/store";
import type { GrantsPoolTokens } from "@prisma/client";

interface SubmitMilestoneModalProps {
  milestoneId: string | number;
  safeTransactionHash: string | null;
}

export default function SubmitMilestoneModal({ milestoneId, safeTransactionHash }: SubmitMilestoneModalProps) {
  
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [description, setDescription] = useState("");
  const [links, setLinks] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isReady: safeWalletReady } = useSafeWallet();
  const { setSafeTransactionHandler,clearSafeTransactionHandler,setPodDetailRefreshKey } = useStore();
  const {data: safeTransactionData} = api.milestone.getPaymentTransactionData.useQuery({milestoneId: Number(milestoneId)});

  // 构建 MetaTransactionData
  const buildTransfersData = () => {
    if (!safeTransactionData?.transactions) return [];
    
    return safeTransactionData.transactions.sort((a,b)=>a.to.localeCompare(b.to)).map(transaction => 
      buildMetaTransactionData(
        transaction.token as GrantsPoolTokens,
        transaction.to,
        transaction.amount
      )
    );
  };

  const submitMilestoneDeliveryMutation = api.milestone.submitMilestoneDelivery.useMutation({
    onSuccess: async() => {
      // 重置表单
      setDescription("");
      setLinks({});
      onClose();
      await delay_s(2000);
      toast.success("Milestone delivery submitted successfully!");
      setPodDetailRefreshKey();
    },
    onError: (error) => {
      console.error("Submission failed:", error);  
      toast.error(`Submission failed: ${error.message}`);
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const handleSubmit = async () => {
    if (!description.trim()) {
      toast.error("Please enter a milestone description");
      return;
    }

    if (!safeTransactionData) {
      toast.error("Transaction data not available");
      return;
    }

    // setIsSubmitting(true);

    try {
      const transfersData = buildTransfersData();
      if (transfersData.length === 0) {
        toast.error("No transaction data to process");
        return;
      }
      
      // 如果存在则直接提交，不用再次执行safe钱包交易
      if(safeTransactionHash){
         await submitMilestoneDeliveryMutation.mutateAsync({
          milestoneId: Number(milestoneId),
          content: description.trim(),
          links: links,
          transactionHash: safeTransactionHash
        });
        return;
      }

      // 构建交易描述
      const getTransactionDescription = () => (
        <div className="space-y-3">
          <div className="p-3 border rounded-lg bg-success/5 border-success/10">
            <h4 className="mb-2 font-medium text-success">Milestone Payment Details</h4>
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
            <i className="ri-send-plane-line"></i>
            <span>Requires Pod multi-sig wallet confirmation</span>
          </div>
        </div>
      );

      // 触发 SafeWallet 交易处理
      setSafeTransactionHandler({
        safeAddress: safeTransactionData.treasuryWallet,
        transfers: transfersData,
        title: 'Milestone Delivery Request',
        description: getTransactionDescription(),
        
        onStepChange: async (step, status, data, error) => {
          console.log('Milestone payment step change:', { step, status, data, error });
          
          // 只有当提案步骤成功完成时才调用提交接口
          if (step === SafeTransactionStep.CONFIRMATION && status === SafeStepStatus.SUCCESS) {
            try {
              const transactionHash = data?.transactionHash;
              if (!transactionHash) {
                throw new Error('Transaction hash not found');
              }

              toast.info('Proposal created successfully, submitting milestone...');

              setIsSubmitting(true);
              clearSafeTransactionHandler();
              
              // 调用里程碑提交接口
              await submitMilestoneDeliveryMutation.mutateAsync({
                milestoneId: Number(milestoneId),
                content: description.trim(),
                links: links,
                transactionHash: transactionHash
              });
              
            } catch (submitError) {
              console.error('Milestone submission failed:', submitError);
              toast.error('Milestone submission failed, please retry');
              setIsSubmitting(false);
            }
          }
          
          // 处理错误状态
          if (status === SafeStepStatus.ERROR && error) {
            console.error('Transaction failed:', error, 'at step:', step);
            toast.error(`❌ Transaction failed at ${step}: ${error.message}`);
            setIsSubmitting(false);
          }
        }
      });

    } catch (error) {
      console.error("Submission failed:", error);  
      toast.error(`Submission failed, please check and try again!`);
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setDescription("");
    setLinks({});
    if (!isSubmitting) {
      onClose();
    }
  };

  return (
    <>
      <Button 
        size="sm" 
        color="success" 
        onPress={onOpen}
      >
      Submit Delivery
      </Button>
      
      <Modal 
        isOpen={isOpen} 
        onOpenChange={handleClose}
        placement="center"
        size="4xl"
        scrollBehavior="inside"
        isDismissable={false}
      >
        <ModalContent>
          <ModalHeader className="text-xl font-bold">
            Submit Milestone Delivery
          </ModalHeader>
          <ModalBody>
            <div className="space-y-6">
              {/* Description Input */}
              <div>
                <MarkdownEditor
                  content={description}
                  onChange={setDescription}
                  placeholder="Describe in detail the work you have completed in this milestone, including deliverables, progress, and any relevant details..."
                />
              </div>

              {/* Links */}
              <div>
                <RelatedLinksSection
                  links={links}
                  onLinksChange={setLinks}
                />
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button 
              color="default" 
              variant="faded" 
              onPress={handleClose}
              isDisabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              color="success" 
              onPress={handleSubmit}
              isLoading={isSubmitting}
              isDisabled={!safeWalletReady || !safeTransactionData}
            >
              {isSubmitting ? "loading..." : "Submit Delivery"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
} 