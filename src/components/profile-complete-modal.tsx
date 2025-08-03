import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from "@heroui/react";
import { useRouter } from "next/navigation";
interface ProfileCompleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToProfile: () => void;
}

export default function ProfileCompleteModal({ 
  isOpen, 
  onClose, 
  onNavigateToProfile 
}: ProfileCompleteModalProps) {
    const router = useRouter();
    const onCloseModal = () => {
        router.back();
        onClose();
    }
  return (
    <Modal isOpen={isOpen} onClose={onCloseModal} size="md">
      <ModalContent>
        <ModalHeader className="text-xl font-bold">
          提示
        </ModalHeader>
        <ModalBody>
          <span>请先完善个人信息，让 Grants pool Moderator 更好的了解你!</span>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onCloseModal}>
            稍后处理
          </Button>
          <Button  onPress={onNavigateToProfile}>
            立即完善
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
} 