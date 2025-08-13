"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { 
  Input, 
  Textarea,
} from "@heroui/react";
import CornerFrame from "~/components/corner-frame";
import AppBtn from "~/components/app-btn";
import RelatedLinksSection from "~/components/related-links-section";
import MilestoneSection from "~/components/milestone-section";
import AvatarInput from "~/components/avatar-input";
import TagsSelect from "~/components/tags-select";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import useStore from "~/store";

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

export default function EditPodPage() {
  const router = useRouter();
  const params = useParams();
  const podId = parseInt(params.id as string);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { userInfo } = useStore();
  
  const [formData, setFormData] = useState({
    avatar: "",
    title: "",
    description: "",
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
  const [milestones, setMilestones] = useState<Milestone[]>([]);

  // 获取Pod详情
  const { data: podDetail, isLoading } = api.pod.getPodDetail.useQuery(
    { id: podId },
    { enabled: !!podId }
  );

  // 获取Pod的milestones（只获取ACTIVE的）
  const { data: podMilestones } = api.milestone.getPodMilestones.useQuery(
    { podId },
    { enabled: !!podId }
  );

  const editPodMutation = api.pod.edit.useMutation({
    onSuccess: () => {
      toast.success("Pod编辑提交成功，等待审核！");
      router.push(`/pods/${podId}`);
    },
    onError: (error) => {
      toast.error(`编辑失败: ${error.message}`);
      setIsSubmitting(false);
    },
  });

  // 初始化表单数据
  useEffect(() => {
    if (podDetail) {
      setFormData({
        avatar: podDetail.avatar ?? "",
        title: podDetail.title ?? "",
        description: podDetail.description ?? "",
        tags: podDetail.tags ?? "",
      });

      // 设置tags
      if (podDetail.tags) {
        setSelectedTags(podDetail.tags.split(','));
      }

      // 设置相关链接
      if (podDetail.links) {
        const links = podDetail.links as Record<string, string>;
        setRelatedLinks({
          website: links.website ?? "",
          github: links.github ?? "",
          twitter: links.twitter ?? "",
          telegram: links.telegram ?? "",
        });
      }
    }
  }, [podDetail]);

  // 初始化milestone数据（简化版本，只处理ACTIVE的）
  useEffect(() => {
    if (podMilestones) {
      // 过滤出ACTIVE状态的milestone并转换格式
      const activeMilestones = podMilestones
        .filter(m => m.status === 'ACTIVE')
        .map((milestone, index) => ({
          id: (index + 1).toString(),
          title: milestone.title,
          description: milestone.description,
          amount: (Number(milestone.amount) / (10 ** 6)).toString(),
          deadline: new Date(milestone.deadline).toISOString().split('T')[0],
        }));

      // 确保至少有一个milestone
      if (activeMilestones.length === 0) {
        activeMilestones.push({
          id: "1",
          title: "",
          deadline: "",
          amount: "100",
          description: ""
        });
      }

      setMilestones(activeMilestones);
    }
  }, [podMilestones]);

  // 权限检查
  const canEdit = useMemo(() => {
    if (!podDetail || !userInfo) return false;
    return podDetail.applicantId === userInfo.id && podDetail.status === 'IN_PROGRESS';
  }, [podDetail, userInfo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description) {
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
        amount: parseFloat(milestone.amount) * 10 ** 6 || 0,
        deadline: milestone.deadline
      }));

      await editPodMutation.mutateAsync({
        id: podId,
        avatar: formData.avatar || undefined,
        title: formData.title,
        description: formData.description,
        tags: selectedTags.length > 0 ? selectedTags.join(',') : undefined,
        links: Object.keys(links).length > 0 ? links : undefined,
        milestones: processedMilestones,
      });
    } catch {
      // 错误处理在mutation的onError中
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="container px-4 py-8 mx-auto">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="text-lg">加载中...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!podDetail) {
    return (
      <div className="container px-4 py-8 mx-auto">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="text-lg text-red-500">Pod不存在</div>
          </div>
        </div>
      </div>
    );
  }

  if (!canEdit) {
    return (
      <div className="container px-4 py-8 mx-auto">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="text-lg text-red-500">
              {podDetail.status !== 'IN_PROGRESS' 
                ? '只能编辑进行中的Pod' 
                : '没有权限编辑此Pod'
              }
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 计算已完成的milestone数量（简化）
  const completedCount = podMilestones?.filter(m => m.status === 'COMPLETED').length ?? 0;
  const maxNewMilestones = 3 - completedCount;

  return (
    <div className="container px-4 py-8 mx-auto fadeIn">
      <div className="max-w-4xl mx-auto">
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Edit Pod Project</h1>
          <p className="mt-2 text-default-500">编辑您的Pod项目信息</p>
          {completedCount > 0 && (
            <div className="p-3 mt-2 border border-blue-200 rounded-lg bg-blue-50">
              <p className="text-sm text-blue-700">
                已完成 {completedCount} 个milestone，最多还可以添加 {maxNewMilestones} 个新milestone
              </p>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 项目描述 */}
          <CornerFrame backgroundColor="var(--color-background)" color="gray">
            <h2 className="mb-6 text-xl">Project Information</h2>
            
            <div className="space-y-6">

              {/* Pod头像 */}
              <AvatarInput
                value={formData.avatar}
                onChange={(value) => handleInputChange("avatar", value)}
                label="Pod Avatar URL"
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
              />

              {/* Tags选择 */}
              <TagsSelect
                selectedTags={selectedTags}
                onTagsChange={setSelectedTags}
                label="Project Tags"
                placeholder="Select tags for your project"
              />
            </div>
          </CornerFrame>

          {/* Milestone Information */}
          <MilestoneSection 
            milestones={milestones}
            onMilestonesChange={setMilestones}
          />

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
                website: links.website ?? '',
                github: links.github ?? '',
                twitter: links.twitter ?? '',
                telegram: links.telegram ?? ''
              });
            }}
          />

          {/* 提交按钮 */}
          <div className="flex items-center justify-center gap-4">
            <AppBtn
              btnProps={{
                type: "button",
                color: "default",
                variant: "bordered",
                className: "flex-1",
                size: "lg",
                onPress: () => router.back()
              }}
            >
              取消
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
              提交编辑
            </AppBtn>
          </div>
        </form>
      </div>
    </div>
  );
}
