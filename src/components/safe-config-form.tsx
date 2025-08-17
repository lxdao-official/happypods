import { useState } from "react";
import { Button, Input, Select, SelectItem } from "@heroui/react";
import { type Address } from "viem";
import { isAddress } from "viem";
import { toast } from "sonner";

interface SafeConfigFormProps {
  owners: string[];
  threshold: number;
  onOwnersChange: (owners: string[]) => void;
  onThresholdChange: (threshold: number) => void;
  isReadOnly?: boolean;
  currentUserAddress?: string; // 当前用户地址，用于特殊保护
}

const SafeConfigForm = ({
  owners,
  threshold,
  onOwnersChange,
  onThresholdChange,
  isReadOnly = false,
  currentUserAddress,
}: SafeConfigFormProps) => {
  const [newOwnerInput, setNewOwnerInput] = useState("");

  // 添加新的owner
  const addOwner = () => {
    if (!newOwnerInput.trim()) {
      toast.error("please input a valid wallet address");
      return;
    }
    
    if (!isAddress(newOwnerInput)) {
      toast.error("please input a valid wallet address");
      return;
    }

    if (owners.includes(newOwnerInput.toLowerCase())) {
      toast.error("this address already exists");
      return;
    }

    const newOwners = [...owners, newOwnerInput.toLowerCase()];
    onOwnersChange(newOwners);
    setNewOwnerInput("");
  };

  // 删除owner
  const removeOwner = (index: number) => {
    if (owners.length <= 1) {
      toast.error("at least one owner is required");
      return;
    }

    const ownerToRemove = owners[index];
    
    // 检查是否尝试删除当前用户地址
    if (currentUserAddress && ownerToRemove?.toLowerCase() === currentUserAddress.toLowerCase()) {
      toast.error("cannot delete current user address");
      return;
    }
    
    const newOwners = owners.filter((_, i) => i !== index);
    onOwnersChange(newOwners);
    
    // 如果threshold大于剩余owners数量，自动调整
    if (threshold > newOwners.length) {
      onThresholdChange(newOwners.length);
    }
  };

  // 检查某个地址是否是当前用户地址
  const isCurrentUser = (ownerAddress: string) => {
    return currentUserAddress && ownerAddress.toLowerCase() === currentUserAddress.toLowerCase();
  };

  return (
    <div className="space-y-4">
      {/* 所有者配置 */}
      <div>
        <h4 className="mb-3 font-medium">Signers ({owners.length})</h4>
        
        {/* 所有者列表 */}
        <div className="mb-4 space-y-2">
          {owners.map((owner, index) => {
            const isCurrentUserAddress = isCurrentUser(owner);
            return (
              <div 
                key={index} 
                className={`flex items-center gap-2 p-2 rounded-lg ${
                  isCurrentUserAddress 
                    ? 'bg-primary-50 border border-primary-200' 
                    : 'bg-default-100'
                }`}
              >
                <div className="flex justify-between flex-1">
                  <span className="font-mono text-sm">{owner}</span>
                  {isCurrentUserAddress && (
                    <span className="px-2 py-1 ml-2 text-xs rounded-full text-primary-600 bg-primary-100">
                      Creator
                    </span>
                  )}
                </div>
                {!isReadOnly && !isCurrentUserAddress && (
                  <Button
                    size="sm"
                    variant="light"
                    color="danger"
                    onPress={() => removeOwner(index)}
                    isDisabled={owners.length <= 1}
                  >
                    <i className="ri-close-large-line"></i> 
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        {/* 添加新所有者 */}
        {!isReadOnly && (
          <div className="flex gap-2">
            <Input
              label="Input wallet address(0x...)"
              value={newOwnerInput}
              size="sm"
              onValueChange={setNewOwnerInput}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  addOwner();
                }
              }}
              endContent={
              <Button size="sm" variant="light" color="success" onPress={addOwner}>
                <i className="text-xl ri-add-line"></i>
              </Button>}
              className="flex-1"
            />
          </div>
        )}
      </div>

      {/* 权限阈值配置 */}
      <div>
        <h4 className="mb-3 font-medium">Threshold</h4>
        <div className="flex items-center gap-4">
          {isReadOnly ? (
            <div className="p-2 rounded-lg bg-default-100">
              <span className="text-sm">Need <span className="text-green-500">{threshold}</span> / {owners.length} signatures</span>
            </div>
          ) : (
            <>
              <Select
                label="Number of signatures required"
                selectedKeys={[threshold.toString()]}
                defaultSelectedKeys={[threshold.toString()]}
                onSelectionChange={(keys) => {
                  const value = Array.from(keys)[0] as string;
                  onThresholdChange(parseInt(value));
                }}
                className="max-w-xs"
                items={Array.from({ length: owners.length }, (_, i) => ({
                  key: (i + 1).toString(),
                  label: (i + 1).toString()
                }))}
              >
                {(item) => (
                  <SelectItem key={item.key}>
                    {item.label}
                  </SelectItem>
                )}
              </Select>
              <span className="text-sm text-default-500">/ {owners.length} owners</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SafeConfigForm;
