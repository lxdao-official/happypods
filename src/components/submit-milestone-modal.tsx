import { useState } from "react";
import { Button, Modal, ModalBody, ModalContent, ModalHeader, ModalFooter, Textarea, useDisclosure } from "@heroui/react";
import RelatedLinksSection from "./related-links-section";

interface SubmitMilestoneModalProps {
  milestoneId: string | number;
  onSubmit?: (data: { description: string; links: Record<string, string> }) => void;
}

export default function SubmitMilestoneModal({ milestoneId, onSubmit }: SubmitMilestoneModalProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [description, setDescription] = useState("");
  const [links, setLinks] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!description.trim()) {
      alert("请输入milestone描述");
      return;
    }

    setIsSubmitting(true);
    try {
      // 模拟提交
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onSubmit?.({ description: description.trim(), links });
      
      // 重置表单
      setDescription("");
      setLinks({});
      onClose();
      
      alert("Milestone提交成功！");
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
      <Button 
        size="sm" 
        color="success" 
        variant="flat"
        onPress={onOpen}
      >
        Submit Milestone
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
            Submit Milestone
          </ModalHeader>
          <ModalBody>
            <div className="space-y-6">
              {/* Description Input */}
              <div>
                <Textarea
                  label="Milestone Description"
                  placeholder="Describe what you have accomplished in this milestone, including deliverables, progress, and any relevant details..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  minRows={6}
                  maxRows={12}
                  isRequired
                  description="Provide a detailed description of your milestone completion"
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
              Cancel
            </Button>
            <Button 
              color="primary" 
              onPress={handleSubmit}
              isLoading={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Submit Milestone"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
} 