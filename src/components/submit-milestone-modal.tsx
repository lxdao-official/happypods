import { useState } from "react";
import { Button, Modal, ModalBody, ModalContent, ModalHeader, ModalFooter, Textarea, useDisclosure } from "@heroui/react";
import RelatedLinksSection from "./related-links-section";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { delay_s } from "~/lib/utils";
import useSafeWallet from "~/hooks/useSafeWallet";
import { buildErc20TransfersSafeTransaction } from "~/lib/safeUtils";

interface SubmitMilestoneModalProps {
  milestoneId: string | number;
  safeTransactionHash: string | null;
}

export default function SubmitMilestoneModal({ milestoneId }: SubmitMilestoneModalProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [description, setDescription] = useState("");
  const [links, setLinks] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {proposeOrExecuteTransaction,isReady} = useSafeWallet();
  const {data: safeTransactionData} = api.milestone.getPaymentTransactionData.useQuery({milestoneId: Number(milestoneId)});

  const submitMilestoneDeliveryMutation = api.milestone.submitMilestoneDelivery.useMutation({
    onSuccess: async() => {
      // 重置表单
      setDescription("");
      setLinks({});
      onClose();
      await delay_s(2000);
      toast.success("Milestone delivery submitted successfully!");
      window.location.reload();
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

    setIsSubmitting(true);

    if(!safeTransactionData) return toast.error("safeTransactionData is null");

    try {
      const safeTxHash = await proposeOrExecuteTransaction(safeTransactionData.treasuryWallet, safeTransactionData.transactions);
      if(!safeTxHash) return;
      await submitMilestoneDeliveryMutation.mutateAsync({
        milestoneId: Number(milestoneId),
        content: description.trim(),
        links: links,
        transactionHash: safeTxHash
      });
    } catch (error) {
      // 错误处理在mutation的onError中
      console.error("Submission failed:", error);  
      toast.error(`Submission failed, please check and try again!`);
    } finally {
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
        variant="flat"
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
      >
        <ModalContent>
          <ModalHeader className="text-xl font-bold">
            Submit Milestone Delivery
          </ModalHeader>
          <ModalBody>
            <div className="space-y-6">
              {/* Description Input */}
              <div>
                <Textarea
                  variant="bordered"
                  label="Milestone Delivery Content"
                  placeholder="Describe in detail the work you have completed in this milestone, including deliverables, progress, and any relevant details..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  minRows={6}
                  maxRows={12}
                  isRequired
                  errorMessage="Please enter a milestone description"
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
              variant="bordered" 
              onPress={handleClose}
              isDisabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              color="success" 
              onPress={handleSubmit}
              isLoading={isSubmitting}
              isDisabled={!isReady}
            >
              {isSubmitting ? "loading..." : "Submit Delivery"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
} 