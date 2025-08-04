import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from "@heroui/react";
import { api } from "~/trpc/react";


export default function GpOwnerCheck() {
  const router = useRouter();
  const { address } = useAccount();
  const [showModal, setShowModal] = useState(false);

  // 获取当前用户的 GP 列表
  const { data: myGrantsPools } = api.grantsPool.isUserHasGrantsPool.useQuery();


  // 检查当前用户是否创建了任何 GP（GP 创建者不能申请任何 Pod）
  useEffect(() => {
    console.log('GpOwnerCheck useEffect:', {
      myGrantsPools,
      address,
      hasCreatedGp: myGrantsPools
    });
    
    if (myGrantsPools) {
      // 如果用户创建了任何 GP，则不允许申请 Pod
      console.log('Setting showModal to true - User has created GP');
      setShowModal(true);
    }
  }, [myGrantsPools]);

  const handleCloseModal = () => {
    setShowModal(false);
    router.back();
  };

  const handleConfirm = () => {
    setShowModal(false);
    router.back();
  };

  return (
    <div>
      <Modal isOpen={showModal} onClose={handleCloseModal} size="md" isDismissable={false}>
        <ModalContent>
          <ModalHeader className="text-xl font-bold">
            GP 创建者无法申请 Pod
          </ModalHeader>
          <ModalBody>
            <small>您已经创建了 Grants Pool，作为 GP 创建者，您不能申请任何 Pod 项目。GP 创建者的职责是管理和审核 Pod 申请，而不是申请 Pod。</small>
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