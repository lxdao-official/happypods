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
    <Modal isOpen={isOpen} onClose={onCloseModal} size="md" isDismissable={false}>
      <ModalContent>
        <ModalHeader className="text-xl font-bold">
          Tip
        </ModalHeader>
        <ModalBody>
          <small>Please complete your personal information first, so that the Grants Pool Moderator can better understand you!</small>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onCloseModal}>
            Handle Later
          </Button>
          <Button color="success" onPress={onNavigateToProfile}>
            Complete Now
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
} 