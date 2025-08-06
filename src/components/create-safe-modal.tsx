import { useEffect, useState } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input } from "@heroui/react";
import CornerFrame from "~/components/corner-frame";
import useSafeWallet from "~/app/hooks/useSafeWallet";
import { useAccount } from "wagmi";
import { toast } from "sonner";

interface CreateSafeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (safeAddress: string) => void;
}

const CreateSafeModal = ({ isOpen, onClose, onConfirm }: CreateSafeModalProps) => {
  const [safeAddress, setSafeAddress] = useState("");
  const { address } = useAccount();
  const { deploySafe,status } = useSafeWallet({saltNonce: address||''});

  const handleCreateSafe = async () => {
    try {
      const { safeAddress } = await deploySafe();
      setSafeAddress(safeAddress);
    } catch (error) {
      console.error("Failed to create Safe:", error);
    }
  };

  useEffect(() => {
    if (status === 'success') {
      onConfirm(safeAddress);
    }
  }, [status]);

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
                    <div className="space-y-2 text-xs text-default-500">
                      <div>Network: Optimism Mainnet</div>
                      <div>Type: Multi-sig Wallet</div>
                      <div>Purpose: Grants Pool Treasury Management</div>
                    </div>
                  </div>
                
                {safeAddress && (
                  <div>
                    <label className="text-sm font-medium">Generated Safe Address</label>
                    <Input
                      value={safeAddress}
                      readOnly
                      disabled
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
              isLoading={status === 'loading'}
            >
              {status === 'loading' ? "Creating..." : "Create Safe Multi-sig Wallet"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
  );
};

export default CreateSafeModal; 