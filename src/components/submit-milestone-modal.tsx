import { useState } from "react";
import { Button, Modal, ModalBody, ModalContent, ModalHeader, ModalFooter, Textarea, useDisclosure } from "@heroui/react";
import RelatedLinksSection from "./related-links-section";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { delay_s } from "~/lib/utils";
import useSafeWallet from "~/app/hooks/useSafeWallet";

interface SubmitMilestoneModalProps {
  milestoneId: string | number;
}

export default function SubmitMilestoneModal({ milestoneId }: SubmitMilestoneModalProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [description, setDescription] = useState("");
  const [links, setLinks] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {buildErc20TransfersSafeTransaction,executeSafeTransaction,getTransactionHash} = useSafeWallet();
  const {data: safeTransactionData} = api.milestone.getPaymentTransactionData.useQuery({milestoneId: Number(milestoneId)});

  console.log('safeTransactionData=??',safeTransactionData);
  const submitMilestoneDeliveryMutation = api.milestone.submitMilestoneDelivery.useMutation({
    onSuccess: async() => {
      // 重置表单
      setDescription("");
      setLinks({});
      onClose();
      await delay_s(2000);
      toast.success("Milestone交付提交成功！");
      window.location.reload();
    },
    onError: (error) => {
      console.error("提交失败:", error);  
      toast.error(`提交失败: ${error.message}`);
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const handleSubmit = async () => {
    if (!description.trim()) {
      toast.error("请输入milestone描述");
      return;
    }

    setIsSubmitting(true);

    if(!safeTransactionData) return toast.error("safeTransactionData is null");

    // 构建转账+手续费交易
    const safeTransaction = await buildErc20TransfersSafeTransaction(safeTransactionData.treasuryWallet, 
      safeTransactionData.transactions.map(transaction => ({
        token: transaction.token,
        to: transaction.to,
        amount: transaction.amount
      }))
    )
    console.log('safeTransaction', safeTransaction);
    // 获取hash, 签名交易, 提案交易
    const transactionHash = await getTransactionHash(safeTransactionData.treasuryWallet, safeTransaction, true);
    console.log('transactionHash', transactionHash);

    try {
      await submitMilestoneDeliveryMutation.mutateAsync({
        milestoneId: Number(milestoneId),
        content: description.trim(),
        links: links,
        transactionHash
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

  return (
    <>
      <Button 
        size="sm" 
        color="success" 
        variant="flat"
        onPress={onOpen}
      >
      提交交付
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
            提交 Milestone 交付
          </ModalHeader>
          <ModalBody>
            <div className="space-y-6">
              {/* Description Input */}
              <div>
                <Textarea
                  variant="bordered"
                  label="Milestone交付内容"
                  placeholder="详细描述您在此里程碑中完成的工作，包括交付物、进度和任何相关细节..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  minRows={6}
                  maxRows={12}
                  isRequired
                />
              </div>

              {/* Related Links */}
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
              取消
            </Button>
            <Button 
              color="success" 
              onPress={handleSubmit}
              isLoading={isSubmitting}
            >
              {isSubmitting ? "提交中..." : "提交交付"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
} 