"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Input, 
  Textarea, 
  Select, 
  SelectItem
} from "@heroui/react";
import CornerFrame from "~/components/corner-frame";
import AppBtn from "~/components/app-btn";
import RFPSection from "~/components/rfp-section";
import RelatedLinksSection from "~/components/related-links-section";
import CreateSafeModal from "~/components/create-safe-modal";
import TagsSelect from "~/components/tags-select";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import AvatarInput from "~/components/avatar-input";

interface RFP {
  id: string;
  title: string;
  description: string;
}

interface RelatedLinks {
  website: string;
  github: string;
  twitter: string;
  telegram: string;
}

export default function CreateGrantsPoolPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSafeModal, setShowSafeModal] = useState(true);
  const [safeAddress, setSafeAddress] = useState("");
  const [formData, setFormData] = useState({
    avatar: "",
    name: "",
    description: "",
    treasuryWallet: "",
    chainType: "OPTIMISM" as "ETHEREUM" | "OPTIMISM",
    // Moderator info
    modName: "",
    modEmail: "",
    modTelegram: "",
  });

  // Tags 数据
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // RFP 数据 - 支持多个RFP
  const [rfps, setRfps] = useState<RFP[]>([
    {
      id: "1",
      title: "",
      description: ""
    }
  ]);

  // Related Links 数据
  const [relatedLinks, setRelatedLinks] = useState<RelatedLinks>({
    website: "",
    github: "",
    twitter: "",
    telegram: "",
  });

  const createGrantsPoolMutation = api.grantsPool.create.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 验证基本信息
    if (!formData.avatar || !formData.name || !formData.description) {
      toast.error("Please fill in avatar URL, Grants Pool name and description");
      return;
    }

    // 验证管理员信息
    if (!formData.modName || !formData.modEmail || !formData.modTelegram) {
      toast.error("Please fill in complete moderator information (name, email, Telegram)");
      return;
    }

    // 验证RFP信息
    if (rfps.length === 0) {
      toast.error("At least one RFP is required");
      return;
    }

    // 检查每个RFP的标题和描述
    for (let i = 0; i < rfps.length; i++) {
      const rfp = rfps[i];
      if (!rfp?.title.trim()) {
        toast.error(`Please fill in RFP #${i + 1} title`);
        return;
      }
      if (!rfp?.description.trim()) {
        toast.error(`Please fill in RFP #${i + 1} description`);
        return;
      }
    }

    // 如果没有Safe地址，先创建Safe多签钱包
    if (!safeAddress) {
      setShowSafeModal(true);
      return;
    }

    setIsSubmitting(true);
    try {
      // 过滤掉空的链接
      const links = Object.entries(relatedLinks).reduce((acc, [key, value]) => {
        if (value.trim()) {
          acc[key] = value.trim();
        }
        return acc;
      }, {} as Record<string, string>);

      // 处理多个RFP
      const processedRfps = rfps.map(rfp => ({
        title: rfp.title || "Default RFP",
        description: rfp.description || "Please provide RFP description"
      }));

      const modInfo = {
        name: formData.modName || "Not set",
        email: formData.modEmail || "Not set",
        telegram: formData.modTelegram || "Not set",
      };

      await createGrantsPoolMutation.mutateAsync({
        avatar: formData.avatar || undefined,
        name: formData.name,
        description: formData.description,
        tags: selectedTags.length > 0 ? selectedTags.join(',') : undefined,
        treasuryWallet: safeAddress, // 使用Safe地址
        chainType: formData.chainType,
        links: Object.keys(links).length > 0 ? links : undefined,
        rfps: processedRfps, // 传递所有RFP
        modInfo,
      });

      toast.success("Grants Pool created successfully!");
      router.push("/grants-pool");
    } catch (error) {
      console.error("Failed to create Grants Pool:", error);
      toast.error("Creation failed, please try again");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSafeConfirm = (address: string) => {
    setSafeAddress(address);
    setShowSafeModal(false);
    // 自动提交表单
    handleSubmit(new Event('submit') as any);
  };

  return (
    <div className="container px-4 py-8 mx-auto">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Create Grants Pool</h1>
          <p className="mt-2 text-default-500">Fill in the following information to create your Grants Pool</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* General Information */}
          <CornerFrame backgroundColor="var(--color-background)" color="gray">
            <h2 className="mb-6 text-xl">General Information</h2>
            <div className="space-y-6">
              {/* Avatar */}
              <AvatarInput
                value={formData.avatar}
                onChange={(value) => handleInputChange("avatar", value)}
                label="Grants Pool Avatar URL"
                description="Enter the URL of the Grants Pool avatar image"
              />

              {/* Name */}
              <Input
                variant="bordered"
                type="text"
                label="Grants Pool Name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter the name of the Grants Pool"
                isRequired
              />

              {/* Description */}
              <Textarea
                variant="bordered"
                label="Description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Describe the goals, vision, and funding direction of your Grants Pool"
                isRequired
                minRows={4}
              />

              {/* Chain Type - 只允许Optimism */}
              <Select
                variant="bordered"
                label="Treasury Chain Type"
                value={formData.chainType}
                defaultSelectedKeys={[formData.chainType]}
                onChange={(e) => handleInputChange("chainType", e.target.value)}
                isRequired
              >
                <SelectItem key="OPTIMISM">Optimism Network</SelectItem>
                <SelectItem key="ETHEREUM" isDisabled>Ethereum Mainnet (Not Available)</SelectItem>
              </Select>

              {/* Tags */}
              <TagsSelect
                selectedTags={selectedTags}
                onTagsChange={setSelectedTags}
                label="Tags"
                placeholder="DeFi,Web3,DAO"
                description="Choose relevant tags for your Grants Pool"
              />

              {/* Safe Address Display */}
              {safeAddress && (
                <div>
                  <label className="text-sm font-medium">Safe Multi-sig Wallet Address</label>
                  <Input
                    value={safeAddress}
                    readOnly
                    variant="bordered"
                    className="mt-1"
                    description="Created Safe multi-sig wallet address"
                  />
                </div>
              )}
            </div>
          </CornerFrame>

          {/* RFP Information - 使用新组件 */}
          <RFPSection 
            rfps={rfps}
            onRfpsChange={setRfps}
          />

          {/* Moderator Information */}
          <CornerFrame backgroundColor="var(--color-background)" color="gray" >
            <h2 className="mb-6 text-xl">Moderator Information</h2>
            <div className="space-y-6">
              <Input
                variant="bordered"
                type="text"
                label="Moderator Name"
                value={formData.modName}
                onChange={(e) => handleInputChange("modName", e.target.value)}
                placeholder="Moderator Name"
                isRequired
              />

              <Input
                variant="bordered"
                type="email"
                label="Moderator Email"
                value={formData.modEmail}
                onChange={(e) => handleInputChange("modEmail", e.target.value)}
                placeholder="admin@example.com"
                isRequired
              />

              <Input
                variant="bordered"
                type="text"
                label="Moderator Telegram"
                value={formData.modTelegram}
                onChange={(e) => handleInputChange("modTelegram", e.target.value)}
                placeholder="@username"
                isRequired
              />
            </div>
          </CornerFrame>

          {/* Related Links - 使用新组件 */}
          <RelatedLinksSection 
            links={{
              website: relatedLinks.website,
              github: relatedLinks.github,
              twitter: relatedLinks.twitter,
              telegram: relatedLinks.telegram
            }}
            onLinksChange={(links: Record<string, string>) => {
              setRelatedLinks({
                website: links.website || '',
                github: links.github || '',
                twitter: links.twitter || '',
                telegram: links.telegram || ''
              });
            }}
          />

          {/* Submit Button */}
          <div className="flex items-center justify-center">
            <AppBtn
              btnProps={{
                type: "submit",
                color: "primary",
                isLoading: isSubmitting,
                className: "flex-1",
                size: "lg",
              }}
            >
              {isSubmitting ? "Creating..." : "Create Grants Pool"}
            </AppBtn>
          </div>
        </form>
      </div>

      {/* Safe创建模态框 */}
      <CreateSafeModal
        isOpen={showSafeModal}
        onClose={() => setShowSafeModal(false)}
        onConfirm={handleSafeConfirm}
      />
    </div>
  );
}