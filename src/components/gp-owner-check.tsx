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
            无法申请自己的 Grants Pool
          </ModalHeader>
          <ModalBody>
            <small>您是该 Grants Pool 的创建者，不能申请自己创建的 GP 下的 Pod 项目。作为 GP 创建者，您的职责是管理和审核其他人的 Pod 申请。</small>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={handleCloseModal}>
              关闭
            </Button>
            <Button color="primary" onPress={handleConfirm}>
              确定
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
} 