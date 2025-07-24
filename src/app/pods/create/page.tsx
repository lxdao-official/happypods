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
import RelatedLinksSection from "~/components/related-links-section";
import MilestoneSection from "~/components/milestone-section";
import { api } from "~/trpc/react";

interface RelatedLinks {
  website: string;
  github: string;
  twitter: string;
  telegram: string;
}

interface Milestone {
  id: string;
  deadline: string;
  amount: string;
  description: string;
}

export default function CreatePodPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    grantsPoolId: "",
    rfpIndex: "",
    avatar: "",
    name: "",
    shortDescription: "",
    detailDescription: "",
    currency: "",
  });

  // Related Links 数据
  const [relatedLinks, setRelatedLinks] = useState<RelatedLinks>({
    website: "",
    github: "",
    twitter: "",
    telegram: "",
  });

  // Milestones 数据
  const [milestones, setMilestones] = useState<Milestone[]>([
    {
      id: "1",
      deadline: "",
      amount: "100",
      description: ""
    }
  ]);

  const { data: grantsPools, isLoading: grantsPoolsLoading } = api.grantsPool.getActiveGrantsPools.useQuery();
  const createPodMutation = api.pod.create.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.grantsPoolId || !formData.name || !formData.shortDescription || !formData.detailDescription || !formData.currency) {
      alert("请填写所有必需字段");
      return;
    }

    // 验证里程碑
    const hasInvalidMilestone = milestones.some(milestone => 
      !milestone.description.trim() || !milestone.amount || !milestone.deadline
    );
    if (hasInvalidMilestone) {
      alert("请完整填写所有里程碑信息");
      return;
    }

    setIsSubmitting(true);
    try {
      const links = {
        ...(relatedLinks.website && { website: relatedLinks.website }),
        ...(relatedLinks.github && { github: relatedLinks.github }),
        ...(relatedLinks.twitter && { twitter: relatedLinks.twitter }),
        ...(relatedLinks.telegram && { telegram: relatedLinks.telegram }),
      };

      // 处理里程碑数据
      const processedMilestones = milestones.map(milestone => ({
        deadline: milestone.deadline || undefined,
        amount: parseFloat(milestone.amount) || 0,
        description: milestone.description || "No description provided"
      }));

      // 临时记录里程碑数据（等待API支持）
      console.log("Milestones data:", processedMilestones);

              await createPodMutation.mutateAsync({
        grantsPoolId: parseInt(formData.grantsPoolId),
        rfpIndex: parseInt(formData.rfpIndex) || 0,
        avatar: formData.avatar || undefined,
        name: formData.name,
        shortDescription: formData.shortDescription,
        detailDescription: formData.detailDescription,
        currency: formData.currency,
        links: Object.keys(links).length > 0 ? links : undefined,
        // TODO: Add milestones support to API
        // milestones: processedMilestones,
      });

      alert("Pod创建成功！");
      router.push("/pods");
    } catch (error) {
      console.error("创建Pod失败:", error);
      alert("创建失败，请重试");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="container px-4 py-8 mx-auto">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Create Pod Project</h1>
          <p className="mt-2 text-default-500">Fill in the following information to create your Pod project</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 基本信息 */}
          <CornerFrame backgroundColor="var(--color-background)">
            <h2 className="mb-6 text-xl">Basic Information</h2>
            <div className="space-y-6">
              {/* 选择Grants Pool */}
              <Select
                variant="bordered"
                label="Select Grants Pool"
                isRequired
                placeholder="Please select a Grants Pool"
                selectedKeys={formData.grantsPoolId ? new Set([formData.grantsPoolId]) : new Set()}
                onSelectionChange={(keys) => {
                  const grantsPoolId = Array.from(keys)[0] as string;
                  handleInputChange("grantsPoolId", grantsPoolId || "");
                }}
                isLoading={grantsPoolsLoading}
              >
                {grantsPools?.map((gp) => (
                  <SelectItem key={gp.id.toString()}>
                    {gp.name} ({gp.chainType})
                  </SelectItem>
                )) ?? []}
              </Select>

              {/* RFP索引 */}
              <Input
                variant="bordered"
                type="number"
                label="RFP Index"
                value={formData.rfpIndex}
                onChange={(e) => handleInputChange("rfpIndex", e.target.value)}
                placeholder="0"
                description="RFP index in the selected Grants Pool"
                min="0"
              />

              {/* Pod头像 */}
              <Input
                variant="bordered"
                type="url"
                label="Pod Avatar URL"
                value={formData.avatar}
                onChange={(e) => handleInputChange("avatar", e.target.value)}
                placeholder="https://example.com/avatar.jpg"
                description="Enter the URL of the Pod avatar image"
              />

              {/* Pod名称 */}
              <Input
                variant="bordered"
                type="text"
                label="Pod Name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter Pod name"
                isRequired
              />

              {/* 申请币种 */}
              <Input
                variant="bordered"
                type="text"
                label="Currency"
                value={formData.currency}
                onChange={(e) => handleInputChange("currency", e.target.value)}
                placeholder="e.g. ETH, USDC, DAI"
                isRequired
              />
            </div>
          </CornerFrame>

          {/* 项目描述 */}
          <CornerFrame backgroundColor="var(--color-background)">
            <h2 className="mb-6 text-xl">Project Description</h2>
            <div className="space-y-6">
              {/* 简短描述 */}
              <Textarea
                variant="bordered"
                label="Short Description"
                value={formData.shortDescription}
                onChange={(e) => handleInputChange("shortDescription", e.target.value)}
                placeholder="Briefly describe your project"
                isRequired
                minRows={3}
                description="Summarize your project in concise language"
              />

              {/* 详细描述 */}
              <Textarea
                variant="bordered"
                label="Detailed Description"
                value={formData.detailDescription}
                onChange={(e) => handleInputChange("detailDescription", e.target.value)}
                placeholder="Describe your project in detail, including goals, implementation plan, expected outcomes, etc."
                isRequired
                minRows={8}
                description="Detailed description of project background, goals, technical approach and expected outcomes"
              />
            </div>
          </CornerFrame>

          {/* Milestone Information */}
          <MilestoneSection 
            milestones={milestones}
            onMilestonesChange={setMilestones}
          />

          {/* Related Links - Using Component */}
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

          {/* 提交按钮 */}
          <div className="flex items-center justify-center gap-4">
            <AppBtn
              btnProps={{
                type: "submit",
                color: "primary",
                isLoading: isSubmitting,
                className: "flex-1",
                size: "lg",
              }}
            >
              {isSubmitting ? "Loading..." : "Create Pod"}
            </AppBtn>
          </div>
        </form>
      </div>
    </div>
  );
} 