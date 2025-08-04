import { useState } from "react";
import { Button, Modal, ModalBody, ModalContent, ModalHeader, ModalFooter, Textarea, useDisclosure } from "@heroui/react";
import RelatedLinksSection from "./related-links-section";
import { api } from "~/trpc/react";

interface SubmitMilestoneModalProps {
  milestoneId: string | number;
  onSubmit?: (data: { description: string; links: Record<string, string> }) => void;
}

export default function SubmitMilestoneModal({ milestoneId, onSubmit }: SubmitMilestoneModalProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [description, setDescription] = useState("");
  const [links, setLinks] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitMilestoneDeliveryMutation = api.pod.submitMilestoneDelivery.useMutation({
    onSuccess: () => {
      // 重置表单
      setDescription("");
      setLinks({});
      onClose();
      
      // 调用父组件的回调
      onSubmit?.({ description: description.trim(), links });
      
      alert("Milestone交付提交成功！");
    },
    onError: (error) => {
      console.error("提交失败:", error);
      alert(`提交失败: ${error.message}`);
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const handleSubmit = async () => {
    if (!description.trim()) {
      alert("请输入milestone描述");
      return;
    }

    setIsSubmitting(true);
    
    try {
      await submitMilestoneDeliveryMutation.mutateAsync({
        milestoneId: Number(milestoneId),
        content: description.trim(),
        links: links,
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
                  description="请提供详细的里程碑完成描述"
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
              color="primary" 
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