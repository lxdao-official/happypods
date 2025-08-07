import { useEffect, useState } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input } from "@heroui/react";
import CornerFrame from "~/components/corner-frame";
import useSafeWallet from "~/app/hooks/useSafeWallet";
import { useAccount } from "wagmi";
import { PLATFORM_MOD_ADDRESS } from "~/lib/config";
import { type Address } from "viem";
import { toast } from "sonner";
import useStore from "~/store";

interface CreateSafeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (safeAddress: string) => void;
  gpAddress?: Address;
}

const CreateSafeModal = ({ isOpen, onClose, onConfirm, gpAddress }: CreateSafeModalProps) => {
  const [safeAddress, setSafeAddress] = useState("");
  const { address } = useAccount();
  const { deploySafe,status } = useSafeWallet();
  const { userInfo } = useStore();

  const handleCreateSafe = async () => {
    if(!address || !gpAddress || !userInfo?.walletAddress) return toast.error("多签钱包成员不足！");
    if(address.toLocaleLowerCase() !== userInfo?.walletAddress.toLocaleLowerCase()) return toast.error(`请使用钱包 ${userInfo?.walletAddress} 创建多签钱包！`);
    try {
      //! 三方共同管理，2/3权限可以动账
      const { safeAddress } = await deploySafe([userInfo?.walletAddress,PLATFORM_MOD_ADDRESS,gpAddress], 2);
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