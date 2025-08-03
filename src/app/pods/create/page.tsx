"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import CreateSafeModal from "~/components/create-safe-modal";
import ProfileCompleteModal from "~/components/profile-complete-modal";
import GrantsPoolInfoSection from "~/components/grants-pool-info-section";
import AvatarInput from "~/components/avatar-input";
import TagsSelect from "~/components/tags-select";
import GpOwnerCheck from "~/components/gp-owner-check";
import { api } from "~/trpc/react";
import { toast } from "sonner";

interface RelatedLinks {
  website: string;
  github: string;
  twitter: string;
  telegram: string;
}

interface Milestone {
  id: string;
  title: string;
  deadline: string;
  amount: string;
  description: string;
}

export default function CreatePodPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSafeModal, setShowSafeModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [safeAddress, setSafeAddress] = useState("");
  
  // URL参数
  const gpId = searchParams.get("gpId");
  const rfpId = searchParams.get("rfpId");
  const isPreselected = !!(gpId && rfpId);

  const [formData, setFormData] = useState({
    grantsPoolId: gpId || "",
    rfpIndex: rfpId || "",
    avatar: "",
    title: "",
    description: "",
    currency: "",
    tags: "",
  });

  // Tags选择状态
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

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
      title: "",
      deadline: "",
      amount: "100",
      description: ""
    }
  ]);

  // API queries
  const { data: userProfile, isLoading: profileLoading } = api.pod.checkUserProfile.useQuery();
  const { data: grantsPoolDetails, isLoading: poolDetailsLoading } = api.pod.getGrantsPoolDetails.useQuery(
    { id: parseInt(formData.grantsPoolId) },
    { enabled: !!formData.grantsPoolId }
  );
  
  const createPodMutation = api.pod.create.useMutation();

  // 检查用户信息是否完善
  useEffect(() => {
    if (userProfile && !userProfile.isComplete) {
      setShowProfileModal(true);
      return;
    }
  }, [userProfile]);

  // 处理预选的GP和RFP
  useEffect(() => {
    if (isPreselected && grantsPoolDetails) {
      // 设置默认币种为第一个可用token
      if (grantsPoolDetails.availableTokens.length > 0 && !formData.currency) {
        setFormData(prev => ({ 
          ...prev, 
          currency: grantsPoolDetails.availableTokens[0]?.symbol || "" 
        }));
      }
    }
  }, [isPreselected, grantsPoolDetails, formData.currency]);

  // 确保URL参数正确设置到formData
  useEffect(() => {
    if (gpId && rfpId) {
      setFormData(prev => ({
        ...prev,
        grantsPoolId: gpId,
        rfpIndex: rfpId,
      }));
    }
  }, [gpId, rfpId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.grantsPoolId || !formData.title || !formData.description || !formData.currency) {
      toast.error("请填写所有必需字段");
      return;
    }

    // 验证里程碑
    const hasInvalidMilestone = milestones.some(milestone => 
      !milestone.title.trim() || !milestone.description.trim() || !milestone.amount || !milestone.deadline
    );
    if (hasInvalidMilestone) {
      toast.error("请完整填写所有里程碑信息");
      return;
    }

    // 验证里程碑总额
    if (grantsPoolDetails) {
      const processedMilestones = milestones.map(milestone => ({
        title: milestone.title,
        description: milestone.description,
        amount: parseFloat(milestone.amount) || 0,
        deadline: milestone.deadline
      }));

      const totalAmount = processedMilestones.reduce((sum, milestone) => sum + milestone.amount, 0);
      const availableToken = grantsPoolDetails.availableTokens.find(token => token.symbol === formData.currency);
      const available = parseFloat(availableToken?.available || "0");

      if (totalAmount > available) {
        toast.error(`里程碑总额 ${totalAmount} ${formData.currency} 超过了可用资金 ${available} ${formData.currency}`);
        return;
      }
    }

    // 显示Safe创建模态框
    setShowSafeModal(true);
  };

  const handleSafeCreated = async (walletAddress: string) => {
    setShowSafeModal(false);
    setSafeAddress(walletAddress);
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
        title: milestone.title,
        description: milestone.description,
        amount: parseFloat(milestone.amount) || 0,
        deadline: milestone.deadline
      }));

      await createPodMutation.mutateAsync({
        grantsPoolId: parseInt(formData.grantsPoolId),
        rfpIndex: parseInt(formData.rfpIndex) || 0,
        walletAddress: walletAddress,
        avatar: formData.avatar || undefined,
        title: formData.title,
        description: formData.description,
        currency: formData.currency,
        tags: selectedTags.length > 0 ? selectedTags.join(',') : undefined,
        links: Object.keys(links).length > 0 ? links : undefined,
        milestones: processedMilestones,
      });

      toast.success("Pod创建成功！");
      router.push("/pods");
    } catch (error) {
      toast.error("创建失败，请重试");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNavigateToProfile = () => {
    setShowProfileModal(false);
    router.push("/profile");
  };

  return (
    <div className="container px-4 py-8 mx-auto">
      <div className="max-w-4xl mx-auto">
        {/* GP 创建者检查组件 */}
        {formData.grantsPoolId && (
          <GpOwnerCheck gpId={parseInt(formData.grantsPoolId)} />
        )}
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Create Pod Project</h1>
          <p className="mt-2 text-default-500">Fill in the following information to create your Pod project</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* GP信息 */}
          <GrantsPoolInfoSection
            grantsPoolId={formData.grantsPoolId}
            rfpIndex={formData.rfpIndex}
            currency={formData.currency}
            onGrantsPoolChange={(grantsPoolId) => handleInputChange("grantsPoolId", grantsPoolId)}
            onRfpChange={(rfpIndex) => handleInputChange("rfpIndex", rfpIndex)}
            onCurrencyChange={(currency) => handleInputChange("currency", currency)}
            isPreselected={isPreselected}
          />

          {/* 项目描述 */}
          <CornerFrame backgroundColor="var(--color-background)" color="gray">
            <h2 className="mb-6 text-xl">Project Information</h2>
            
            <div className="space-y-6">

              {/* Pod头像 */}
              <AvatarInput
                value={formData.avatar}
                onChange={(value) => handleInputChange("avatar", value)}
                label="Pod Avatar URL"
                description="Enter the URL of the Pod avatar image"
              />
                
              {/* 项目标题 */}
              <Input
                variant="bordered"
                type="text"
                label="Project Title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="Enter project title"
                isRequired
                description="Concise title of your project"
              />

              {/* 详细描述 */}
              <Textarea
                variant="bordered"
                label="Project Description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Describe your project in detail, including goals, implementation plan, expected outcomes, etc."
                isRequired
                minRows={8}
                description="Detailed description of project background, goals, technical approach and expected outcomes"
              />

              {/* Tags选择 */}
              <TagsSelect
                selectedTags={selectedTags}
                onTagsChange={setSelectedTags}
                label="Project Tags"
                placeholder="Select tags for your project"
                description="Choose relevant tags to help others discover your project"
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
              {isSubmitting ? "Creating..." : "Create Pod"}
            </AppBtn>
          </div>
        </form>

        {/* Safe 创建模态框 */}
        <CreateSafeModal
          isOpen={showSafeModal}
          onClose={() => setShowSafeModal(false)}
          onConfirm={handleSafeCreated}
        />

        {/* 个人信息完善提示模态框 */}
        <ProfileCompleteModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          onNavigateToProfile={handleNavigateToProfile}
        />
      </div>
    </div>
  );
} 