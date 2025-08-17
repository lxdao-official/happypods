"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
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
import AvatarInput from "~/components/avatar-input";
import TagsSelect from "~/components/tags-select";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import LoadingSkeleton from "~/components/loading-skeleton";
import Empty from "~/components/empty";

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

export default function EditGrantsPoolPage() {
  const router = useRouter();
  const params = useParams();
  const gpId = parseInt(params.id as string);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
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

  // RFP 数据
  const [rfps, setRfps] = useState<RFP[]>([]);

  // Related Links 数据
  const [relatedLinks, setRelatedLinks] = useState<RelatedLinks>({
    website: "",
    github: "",
    twitter: "",
    telegram: "",
  });

  // 获取 GP 详情
  const { data: grantsPoolData, isLoading: gpLoading } = api.grantsPool.getById.useQuery(
    { id: gpId },
    { enabled: !!gpId }
  );

  // 更新 GP
  const updateGrantsPoolMutation = api.grantsPool.update.useMutation();

  // 加载数据到表单
  useEffect(() => {
    if (grantsPoolData && !gpLoading) {
      // 设置基本信息
      setFormData({
        avatar: grantsPoolData.avatar || "",
        name: grantsPoolData.name || "",
        description: grantsPoolData.description || "",
        treasuryWallet: grantsPoolData.treasuryWallet || "",
        chainType: grantsPoolData.chainType || "OPTIMISM",
        // 从 modInfo 中提取管理员信息
        modName: (grantsPoolData.modInfo as any)?.name || "",
        modEmail: (grantsPoolData.modInfo as any)?.email || "",
        modTelegram: (grantsPoolData.modInfo as any)?.telegram || "",
      });

      // 设置标签数据
      if (grantsPoolData.tags) {
        const tagsArray = grantsPoolData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
        setSelectedTags(tagsArray);
      }

      // 设置 RFP 数据
      if (grantsPoolData.rfps) {
        const activeRfps = grantsPoolData.rfps
          .filter(rfp => !rfp.inactiveTime) // 只显示活跃的 RFP
          .map(rfp => ({
            id: rfp.id.toString(),
            title: rfp.title,
            description: rfp.description,
          }));
        setRfps(activeRfps.length > 0 ? activeRfps : [{ id: "new-1", title: "", description: "" }]);
      }

      // 设置关联链接
      const links = grantsPoolData.links as any;
      if (links) {
        setRelatedLinks({
          website: links.website || "",
          github: links.github || "",
          twitter: links.twitter || "",
          telegram: links.telegram || "",
        });
      }

      setIsLoading(false);
    }
  }, [grantsPoolData, gpLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 验证基本信息
    if (!formData.avatar || !formData.name || !formData.description) {
      toast.error("Please fill in the avatar URL, Grants Pool name, and description");
      return;
    }

    // 验证管理员信息
    if (!formData.modName || !formData.modEmail || !formData.modTelegram) {
      toast.error("Please fill in the complete administrator information (Name, Email, Telegram)");
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
        toast.error(`Please fill in the title for RFP #${i + 1}`);
        return;
      }
      if (!rfp?.description.trim()) {
        toast.error(`Please fill in the description for RFP #${i + 1}`);
        return;
      }
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

      // 处理多个RFP - 区分新增和更新
      const processedRfps = rfps.map(rfp => {
        const isNew = rfp.id.startsWith('new-');
        return {
          ...(isNew ? {} : { id: parseInt(rfp.id) }),
          title: rfp.title,
          description: rfp.description,
        };
      });

      const modInfo = {
        name: formData.modName,
        email: formData.modEmail,
        telegram: formData.modTelegram,
      };

      await updateGrantsPoolMutation.mutateAsync({
        id: gpId,
        avatar: formData.avatar || undefined,
        name: formData.name,
        description: formData.description,
        tags: selectedTags.length > 0 ? selectedTags.join(',') : undefined,
        treasuryWallet: formData.treasuryWallet,
        chainType: formData.chainType,
        links: Object.keys(links).length > 0 ? links : undefined,
        rfps: processedRfps,
        modInfo,
      });

      toast.success("Grants Pool updated successfully!");
      router.back();
    } catch (error: any) {
      console.error("Failed to update Grants Pool:", error);
      toast.error(error.message || "Update failed, please try again");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // 如果正在加载，显示加载状态
  if (isLoading || gpLoading) {
    return <div className="container py-8"><LoadingSkeleton/></div>;
  }

  // 如果没有数据，显示错误
  if (!grantsPoolData) {
    return <Empty/>;
  }

  return (
    <div className="container px-4 py-8 mx-auto">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Edit Grants Pool</h1>
          <p className="mt-2 text-default-500">Modify the following information to update your Grants Pool</p>
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

              {/* Tags */}
              <TagsSelect
                selectedTags={selectedTags}
                onTagsChange={setSelectedTags}
                placeholder="Select Tags"
                description="Select relevant tags to describe your Grants Pool"
              />
            </div>
          </CornerFrame>

          {/* RFP Information */}
          <RFPSection 
            rfps={rfps}
            onRfpsChange={setRfps}
            isEdit={true}
            grantsPoolId={gpId}
          />

          {/* Moderator Information */}
          <CornerFrame backgroundColor="var(--color-background)" color="gray">
            <h2 className="mb-6 text-xl">Administrator Information</h2>
            <div className="space-y-6">
              <Input
                variant="bordered"
                type="text"
                label="Administrator Name"
                value={formData.modName}
                onChange={(e) => handleInputChange("modName", e.target.value)}
                placeholder="Administrator Name"
                isRequired
              />

              <Input
                variant="bordered"
                type="email"
                label="Administrator Email"
                value={formData.modEmail}
                onChange={(e) => handleInputChange("modEmail", e.target.value)}
                placeholder="admin@example.com"
                isRequired
              />

              <Input
                variant="bordered"
                type="text"
                label="Administrator Telegram"
                value={formData.modTelegram}
                onChange={(e) => handleInputChange("modTelegram", e.target.value)}
                placeholder="@username"
                isRequired
              />
            </div>
          </CornerFrame>

          {/* Related Links */}
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
          <div className="flex items-center justify-center gap-4">
            <AppBtn
              btnProps={{
                color: "default",
                onClick: () => router.back(),
                type: "button",
                className: "flex-1",
                size: "lg",
              }}
            >
              Cancel
            </AppBtn>
            <AppBtn
              btnProps={{
                type: "submit",
                color: "primary",
                isLoading: isSubmitting,
                className: "flex-1",
                size: "lg",
              }}
            >
              {isSubmitting ? "Updating..." : "Update"}
            </AppBtn>
          </div>
        </form>
      </div>
    </div>
  );
}