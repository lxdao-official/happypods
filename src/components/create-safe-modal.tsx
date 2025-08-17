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
  predefinedOwners?: Address[];
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
      toast.error("至少需要一个所有者");
      return false;
    }

    if (threshold < 1 || threshold > owners.length) {
      toast.error(`权限阈值必须在 1 到 ${owners.length} 之间`);
      return false;
    }

    return true;
  };

  const handleCreateSafe = async () => {
    if (!address || !userInfo?.walletAddress) {
      toast.error("请先连接钱包");
      return;
    }

    if (address.toLowerCase() !== userInfo.walletAddress.toLowerCase()) {
      toast.error(`请使用钱包 ${userInfo.walletAddress} 创建多签钱包！`);
      return;
    }

    if (!validateForm()) {
      return;
    }

    try {
      const { safeAddress } = await deploySafe(owners as Address[], threshold);
      console.log('safeAddress===?>',safeAddress);
      onConfirm(safeAddress);
    } catch (error) {
      console.error("Failed to create Safe:", error);
      toast.error("创建多签钱包失败");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="3xl" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader>创建Safe多签钱包</ModalHeader>
        <ModalBody>
          <div className="space-y-6">
            <p className="text-default-600">{description ??  'Grants Pool 资金将由当前创建的 Safe 多签钱包管理!'}</p>
            
            <CornerFrame backgroundColor="var(--color-background)" color="gray">
              <div className="space-y-4">
                <div>
                  <h3 className="mb-2 font-medium">多签钱包信息</h3>
                  <div className="space-y-2 text-xs text-default-500">
                    <div>网络: Optimism Mainnet</div>
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
                      variant="bordered"
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
            取消
          </Button>
          <Button 
            color="success" 
            onPress={handleCreateSafe}
            isLoading={status === 'loading'}
            isDisabled={owners.length === 0 || threshold < 1 || threshold > owners.length}
          >
            {status === 'loading' ? "创建中..." : "创建多签钱包"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CreateSafeModal; 