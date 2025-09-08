import { useEffect, useState } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input } from "@heroui/react";
import CornerFrame from "~/components/corner-frame";
import SafeConfigForm from "~/components/safe-config-form";
import useSafeWallet from "~/hooks/useSafeWallet";
import { useAccount } from "wagmi";
import { type Address } from "viem";
import { toast } from "sonner";
import useStore from "~/store";

interface CreateSafeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (safeAddress: string) => void;
  // 可选的预设参数，如果传入则不可更改
  predefinedOwners?: string[];
  predefinedThreshold?: number;
  description?: string;
}

const CreateSafeModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  predefinedOwners, 
  predefinedThreshold,
  description
}: CreateSafeModalProps) => {
  const { address } = useAccount();
  const { deploySafe, status } = useSafeWallet();
  const { userInfo } = useStore();

  // 状态管理
  const [owners, setOwners] = useState<string[]>([]);
  const [threshold, setThreshold] = useState<number>(2);

  // 判断是否使用预设参数
  const isUsingPredefined = predefinedOwners && predefinedThreshold !== undefined;

  // 初始化owners和threshold
  useEffect(() => {
    if (isUsingPredefined) {
      setThreshold(predefinedThreshold);
      setOwners(predefinedOwners);
    } else {
      // 手动场景下，默认只包含当前用户地址
      const defaultOwners = [];
      if (userInfo?.walletAddress) {
        defaultOwners.push(userInfo.walletAddress.toLowerCase());
      }
      setOwners(defaultOwners);
      setThreshold(1); // 默认阈值 1/1
    }
  }, [isUsingPredefined, predefinedOwners, predefinedThreshold, userInfo?.walletAddress]);

  // 验证表单
  const validateForm = () => {
    if (owners.length === 0) {
      toast.error("At least one owner is required");
      return false;
    }

    if (threshold < 1 || threshold > owners.length) {
      toast.error(`The threshold must be between 1 and ${owners.length}`);
      return false;
    }

    return true;
  };

  const handleCreateSafe = async () => {
    if (!address || !userInfo?.walletAddress) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (address.toLowerCase() !== userInfo.walletAddress.toLowerCase()) {
      toast.error(`Please use wallet ${userInfo.walletAddress} to create the multi-sig wallet!`);
      return;
    }

    if (!validateForm()) {
      return;
    }

    try {
      const { safeAddress } = await deploySafe(owners, threshold);
      console.log('safeAddress===?>',safeAddress);
      onConfirm(safeAddress);
    } catch (error) {
      console.error("Failed to create Safe:", error);
      toast.error("Failed to create multi-sig wallet");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="3xl" scrollBehavior="inside" isDismissable={false}>
      <ModalContent>
        <ModalHeader>Create Safe Multi-sig Wallet</ModalHeader>
        <ModalBody>
          <div className="space-y-6">
            <p className="text-default-600">{description ??  'Grants Pool funds will be managed by the currently created Safe multi-sig wallet!'}</p>
            
            <CornerFrame backgroundColor="var(--color-background)" color="gray">
              <div className="space-y-4">
                <div>
                  <h3 className="mb-2 font-medium">Multi-sig Wallet Information</h3>
                  <div className="space-y-2 text-xs text-default-500">
                    <div>Network: Optimism Mainnet</div>
                  </div>
                </div>

                {/* 多签配置表单 */}
                <SafeConfigForm
                  owners={owners}
                  threshold={threshold}
                  onOwnersChange={setOwners}
                  onThresholdChange={setThreshold}
                  isReadOnly={isUsingPredefined}
                  currentUserAddress={userInfo?.walletAddress}
                />

                {/* {safeAddress && (
                  <div>
                    <label className="text-sm font-medium">生成的Safe地址</label>
                    <Input
                      value={safeAddress}
                      readOnly
                      disabled
                      variant="faded"
                      className="mt-1"
                    />
                  </div>
                )} */}
                
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
            isDisabled={owners.length === 0 || threshold < 1 || threshold > owners.length}
          >
            {status === 'loading' ? "Creating..." : "Create Multi-sig Wallet"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CreateSafeModal; 