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
import { api } from "~/trpc/react";
import { getUser } from "~/lib/auth-storage";

// Define user role options
const USER_ROLES = [
  { value: "ADMIN", label: "System Administrator" },
  { value: "GP_MOD", label: "GP Administrator" },
  { value: "APPLICANT", label: "Applicant" },
  { value: "VIEWER", label: "Viewer" },
] as const;

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
      alert("Profile updated successfully!");
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert(`Update failed: ${errorMessage}`);
    },
  });

  // 检查用户登录状态
  useEffect(() => {
    const user = getUser();
    if (!user) {
      alert("Please log in first.");
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
      alert("Failed to get user information.");
      return;
    }

    // 基本验证
    if (!formData.name.trim()) {
      alert("Please enter a username.");
      return;
    }

    if (!formData.email.trim()) {
      alert("Please enter an email address.");
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

  if (!currentUser) {
    return (
      <div className="container px-4 py-8 mx-auto">
        <div className="text-center">
          <div className="mb-4 text-lg text-red-600">
            Please log in first
          </div>
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-700"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading || userLoading) {
    return (
      <div className="container px-4 py-8 mx-auto">
        <div className="max-w-4xl mx-auto">
          <div className="p-6 bg-white rounded-lg shadow-md animate-pulse">
            <div className="h-8 mb-4 bg-gray-200 rounded"></div>
            <div className="h-4 mb-2 bg-gray-200 rounded"></div>
            <div className="h-4 mb-4 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container px-4 py-8 mx-auto">
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
              <Input
                variant="bordered"
                type="url"
                label="Avatar URL"
                value={formData.avatar}
                onChange={(e) => handleInputChange("avatar", e.target.value)}
                placeholder="https://example.com/avatar.jpg"
                description="Enter the URL for your avatar image."
                endContent={
                  formData.avatar && (
                    <img
                      src={formData.avatar}
                      alt="Avatar Preview"
                      className="object-cover w-8 h-8 rounded-full"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  )
                }
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