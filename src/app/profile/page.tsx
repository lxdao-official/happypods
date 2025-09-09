"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Input, 
  Textarea, 
} from "@heroui/react";
import CornerFrame from "~/components/corner-frame";
import AppBtn from "~/components/app-btn";
import RelatedLinksSection from "~/components/related-links-section";
import AvatarInput from "~/components/avatar-input";
import { api } from "~/trpc/react";
import { getUser } from "~/lib/auth-storage";
import { toast } from "sonner";
import LoadingSkeleton from "~/components/loading-skeleton";
import { useUserInfo } from "../../hooks/useUserInfo";

interface FormData {
  avatar: string;
  name: string;
  email: string;
  description: string;
  links: Record<string, string>;
}

export default function ProfilePage() {
  const { fetchAndStoreUserInfo } = useUserInfo();

  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    avatar: "",
    name: "",
    email: "",
    description: "",
    links: {},
  });

  const [currentUser, setCurrentUser] = useState(getUser());
  const [isLoading, setIsLoading] = useState(true);

  const utils = api.useUtils();

  // 获取当前用户信息
  const { data: userData, isLoading: userLoading } = api.user.getById.useQuery(
    { id: currentUser?.id ?? 0 },
    { enabled: !!currentUser?.id }
  );

  // 更新用户
  const updateUser = api.user.update.useMutation({
    onSuccess: async () => {
      await utils.user.invalidate();
      toast.success("Profile updated successfully!");
      router.back();
      fetchAndStoreUserInfo();
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error(`Update failed: ${errorMessage}`);
    },
  });

  // 检查用户登录状态
  useEffect(() => {
    const user = getUser();
    if (!user) {
      toast.error("Please log in first.");
      router.push("/");
      return;
    }
    setCurrentUser(user);
  }, [router]);

  // 加载用户数据到表单
  useEffect(() => {
    if (userData) {
      setFormData({
        avatar: userData.avatar ?? "",
        name: userData.name ?? "",
        email: userData.email ?? "",
        description: userData.description ?? "",
        links: userData.links as any ?? {},
      });
      setIsLoading(false);
    }
  }, [userData]);

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser?.id) {
      toast.error("Failed to get user information.");
      return;
    }

    // 基本验证
    if (!formData.name.trim()) {
      toast.error("Please enter a username.");
      return;
    }

    if (!formData.email.trim()) {
      toast.error("Please enter an email address.");
      return;
    }

    const submitData = {
      id: currentUser.id,
      avatar: formData.avatar || undefined,
      name: formData.name.trim(),
      email: formData.email.trim(),
      description: formData.description.trim() || undefined,
      links:formData.links,
    };

    updateUser.mutate(submitData);
  };

  // 处理输入变化
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };


  if (isLoading || userLoading || !userData) {
    return <div className="container px-4 py-8 mx-auto"><LoadingSkeleton/></div>;
  }

  return (
    <div className="container px-4 py-8 mx-auto fadeIn">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Profile</h1>
          <p className="mt-2 text-default-500">Manage your personal information and preferences.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <CornerFrame backgroundColor="var(--color-background)" color="gray">
            <h2 className="mb-6 text-xl">Basic Information</h2>
            <div className="space-y-6">
              {/* Avatar */}
              <AvatarInput
                value={formData.avatar}
                onChange={(value) => handleInputChange("avatar", value)}
              />

              {/* Username */}
              <Input
                variant="faded"
                type="text"
                label="Username"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter your username"
                isRequired
                errorMessage="Please enter your username"
              />

              {/* Email */}
              <Input
                variant="faded"
                type="email"
                label="Email Address"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="Enter your email address"
                isRequired
                errorMessage="Please enter your email address"
              />

              {/* Bio */}
              <Textarea
                isRequired
                variant="faded"
                label="Bio"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Tell us about yourself"
                minRows={4}
                description="Introduce your background, interests, and professional expertise."
                errorMessage="Please enter your introduction"
              />
            </div>
          </CornerFrame>

          {/* Social Links */}
          <RelatedLinksSection 
            links={formData.links}
            onLinksChange={(links: Record<string, string>) => {
              setFormData(prev => ({
                ...prev,
                links
              }));
            }}
          />

          {/* 提交按钮 */}
          <div className="flex items-center justify-center gap-4">
            <AppBtn
              btnProps={{
                type: "submit",
                color: "success",
                isLoading: updateUser.isPending,
                className: "flex-1",
                size: "lg",
              }}
            >
              {updateUser.isPending ? "Saving..." : "Save Profile"}
            </AppBtn>
          </div>
        </form>
      </div>
    </div>
  );
} 