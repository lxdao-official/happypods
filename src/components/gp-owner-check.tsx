import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from "@heroui/react";
import { api } from "~/trpc/react";

interface GpOwnerCheckProps {
  gpId: number;
}

export default function GpOwnerCheck({ gpId }: GpOwnerCheckProps) {
  const router = useRouter();
  const { address } = useAccount();
  const [showModal, setShowModal] = useState(false);

  // 获取 GP 详情，包含创建者信息
  const { data: grantsPoolDetails, isLoading } = api.pod.getGrantsPoolDetails.useQuery(
    { id: gpId },
    { enabled: !!gpId }
  );

  // 检查当前用户是否为 GP 创建者
  useEffect(() => {
    console.log('GpOwnerCheck useEffect:', {
      grantsPoolDetails,
      address,
      ownerWalletAddress: grantsPoolDetails?.owner?.walletAddress,
      isMatch: grantsPoolDetails?.owner?.walletAddress?.toLowerCase() === address?.toLowerCase()
    });
    
    if (grantsPoolDetails && address) {
      // 检查钱包地址是否匹配
      if (grantsPoolDetails.owner?.walletAddress?.toLowerCase() === address.toLowerCase()) {
        console.log('Setting showModal to true');
        setShowModal(true);
      }
    }
  }, [grantsPoolDetails, address]);

  const handleCloseModal = () => {
    setShowModal(false);
    router.back();
  };

  const handleConfirm = () => {
    setShowModal(false);
    router.back();
  };

  console.log('GpOwnerCheck render:', {
    gpId,
    isLoading,
    grantsPoolDetails: !!grantsPoolDetails,
    address,
    showModal
  });

  // 如果正在加载或没有数据，不渲染任何内容
  if (isLoading || !grantsPoolDetails) {
    return null;
  }

  return (
    <Modal isOpen={showModal} onClose={handleCloseModal} size="md">
      <ModalContent>
        <ModalHeader className="text-xl font-bold">
          无法申请自己的 Grants Pool
        </ModalHeader>
        <ModalBody>
          <small>作为 Grants Pool 的创建者，您不能申请自己创建的 Grants Pool。请选择其他 Grants Pool 进行申请。</small>
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
  );
} 