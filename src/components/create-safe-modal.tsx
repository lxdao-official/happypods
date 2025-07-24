import { useState } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input } from "@heroui/react";
import CornerFrame from "~/components/corner-frame";

interface CreateSafeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (safeAddress: string) => void;
}

const CreateSafeModal = ({ isOpen, onClose, onConfirm }: CreateSafeModalProps) => {
  const [isCreating, setIsCreating] = useState(false);
  const [safeAddress, setSafeAddress] = useState("");

  const handleCreateSafe = async () => {
    setIsCreating(true);
    try {
      // 模拟创建Safe多签钱包的过程
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 模拟生成的Safe地址（实际应该从Safe API获取）
      const mockSafeAddress = `0x${Math.random().toString(16).substring(2, 42)}`;
      setSafeAddress(mockSafeAddress);
      
      // 自动确认并关闭模态框
      onConfirm(mockSafeAddress);
    } catch (error) {
      console.error("Failed to create Safe:", error);
      alert("创建Safe多签钱包失败，请重试");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
      <ModalContent>
        <ModalHeader>Create Safe Multi-sig Wallet</ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <p className="text-default-600">
              Before creating a Grants Pool, you need to create a Safe multi-sig wallet on Optimism mainnet as the treasury wallet.
            </p>
            
            <CornerFrame backgroundColor="var(--color-background)" color="gray">
              <div className="space-y-4">
                                  <div>
                    <h3 className="mb-2 font-medium">Safe Multi-sig Wallet Information</h3>
                    <p className="text-sm text-default-500">
                      Network: Optimism Mainnet<br />
                      Type: Multi-sig Wallet<br />
                      Purpose: Grants Pool Treasury Management
                    </p>
                  </div>
                
                {safeAddress && (
                  <div>
                    <label className="text-sm font-medium">Generated Safe Address</label>
                    <Input
                      value={safeAddress}
                      readOnly
                      variant="bordered"
                      className="mt-1"
                    />
                  </div>
                )}
              </div>
            </CornerFrame>
          </div>
                  </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose}>
              Cancel
            </Button>
            <Button 
              color="success" 
              onPress={handleCreateSafe}
              isLoading={isCreating}
            >
              {isCreating ? "Creating..." : "Create Safe Multi-sig Wallet"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
  );
};

export default CreateSafeModal; 