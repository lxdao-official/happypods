"use client";

import { useState, useEffect } from "react";
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
import AvatarInput from "~/components/avatar-input";
import { api } from "~/trpc/react";
import { getUser } from "~/lib/auth-storage";
import { toast } from "sonner";
import LoadingSkeleton from "~/components/loading-skeleton";
import { useUserInfo } from "../hooks/useUserInfo";

// 定义链接类型
interface UserLinks {
  x?: string;
  telegram?: string;
  github?: string;
  website?: string;
}

interface FormData {
  avatar: string;
  name: string;
  email: string;
  role: "ADMIN" | "GP_MOD" | "APPLICANT" | "VIEWER";
  description: string;
  links: UserLinks;
}

export default function ProfilePage() {
  const { fetchAndStoreUserInfo } = useUserInfo();

  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    avatar: "",
    name: "",
    email: "",
    role: "APPLICANT",
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
        role: userData.role ?? "APPLICANT",
        description: userData.description ?? "",
        links: (userData.links as UserLinks) ?? {},
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

    const links = Object.keys(formData.links).length > 0 
      ? Object.fromEntries(
          Object.entries(formData.links).filter(([_, value]) => (value as string)?.trim())
        ) as Record<string, string> 
      : undefined;

    const submitData = {
      id: currentUser.id,
      avatar: formData.avatar || undefined,
      name: formData.name.trim(),
      email: formData.email.trim(),
      role: formData.role,
      description: formData.description.trim() || undefined,
      links,
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
                variant="bordered"
                type="text"
                label="Username"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter your username"
                isRequired
              />

              {/* Email */}
              <Input
                variant="bordered"
                type="email"
                label="Email Address"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="Enter your email address"
                isRequired
              />

              {/* Bio */}
              <Textarea
                isRequired
                variant="bordered"
                label="Bio"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Tell us about yourself"
                minRows={4}
                description="Introduce your background, interests, and professional expertise."
              />
            </div>
          </CornerFrame>

          {/* Social Links */}
          <RelatedLinksSection 
            links={{
              website: formData.links.website || '',
              github: formData.links.github || '',
              twitter: formData.links.x || '',
              telegram: formData.links.telegram || ''
            }}
            onLinksChange={(links: Record<string, string>) => {
              setFormData(prev => ({
                ...prev,
                links: {
                  website: links.website || undefined,
                  github: links.github || undefined,
                  x: links.twitter || undefined,
                  telegram: links.telegram || undefined,
                }
              }));
            }}
          />

          {/* 提交按钮 */}
          <div className="flex items-center justify-center gap-4">
            <AppBtn
              btnProps={{
                type: "submit",
                color: "primary",
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