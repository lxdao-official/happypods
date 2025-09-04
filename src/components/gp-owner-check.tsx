import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from "@heroui/react";
import useStore from "~/store";


export default function GpOwnerCheck({ onwerId }: {onwerId?: number}) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const { userInfo } = useStore();
  

  const handleCloseModal = () => {
    setShowModal(false);
    router.back();
  };

  const handleConfirm = () => {
    setShowModal(false);
    router.back();
  };

  useEffect(()=>{
    if(userInfo && onwerId === userInfo?.id){
      setShowModal(true)
    }
  },[onwerId,userInfo])

  return (
    <div>
      <Modal isOpen={showModal} onClose={handleCloseModal} size="md" isDismissable={false}>
        <ModalContent>
          <ModalHeader className="text-xl font-bold">
           Cannot apply for your own Grants Pool
          </ModalHeader>
          <ModalBody>
            <small>You are the creator of this Grants Pool, you cannot apply for your own GP.</small>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={handleCloseModal}>
              Close
            </Button>
            <Button color="primary" onPress={handleConfirm} className="text-black">
              Confirm
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
} 