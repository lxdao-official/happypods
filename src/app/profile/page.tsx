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

// 定义用户角色选项
const USER_ROLES = [
  { value: "ADMIN", label: "系统管理员" },
  { value: "GP_MOD", label: "GP管理员" },
  { value: "APPLICANT", label: "申请人" },
  { value: "VIEWER", label: "观察者" },
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
      alert("个人资料更新成功！");
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert(`更新失败：${errorMessage}`);
    },
  });

  // 检查用户登录状态
  useEffect(() => {
    const user = getUser();
    if (!user) {
      alert("请先登录");
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
      alert("用户信息获取失败");
      return;
    }

    // 基本验证
    if (!formData.name.trim()) {
      alert("请输入用户名称");
      return;
    }

    if (!formData.email.trim()) {
      alert("请输入邮箱地址");
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
            请先登录
          </div>
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-700"
          >
            返回首页
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
          <h1 className="text-3xl font-bold text-foreground">个人资料</h1>
          <p className="mt-2 text-default-500">管理您的个人信息和偏好设置</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 基本信息 */}
          <CornerFrame backgroundColor="var(--color-background)">
            <h2 className="mb-6 text-xl">基本信息</h2>
            <div className="space-y-6">
              {/* 头像 */}
              <Input
                variant="bordered"
                type="url"
                label="头像链接"
                value={formData.avatar}
                onChange={(e) => handleInputChange("avatar", e.target.value)}
                placeholder="https://example.com/avatar.jpg"
                description="输入头像图片的 URL 地址"
                endContent={
                  formData.avatar && (
                    <img
                      src={formData.avatar}
                      alt="头像预览"
                      className="object-cover w-8 h-8 rounded-full"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  )
                }
              />

              {/* 用户名称 */}
              <Input
                variant="bordered"
                type="text"
                label="用户名称"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="请输入用户名称"
                isRequired
              />

              {/* 邮箱 */}
              <Input
                variant="bordered"
                type="email"
                label="邮箱地址"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="请输入邮箱地址"
                isRequired
              />

              {/* 用户角色 */}
              <Select
                variant="bordered"
                label="用户角色"
                selectedKeys={[formData.role]}
                onSelectionChange={(keys) => {
                  const role = Array.from(keys)[0] as FormData["role"];
                  handleInputChange("role", role);
                }}
                             >
                 {USER_ROLES.map(role => (
                   <SelectItem key={role.value}>
                     {role.label}
                   </SelectItem>
                 ))}
               </Select>

              {/* 个人简介 */}
              <Textarea
                variant="bordered"
                label="个人简介"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="请输入个人简介"
                minRows={4}
                description="介绍您的背景、兴趣和专业领域"
              />
            </div>
          </CornerFrame>

          {/* 社交链接 */}
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

          {/* 钱包信息 */}
          <CornerFrame backgroundColor="var(--color-background)">
            <h2 className="mb-6 text-xl">钱包信息</h2>
            <Input
                variant="bordered"
              label="钱包地址"
              value={currentUser.address}
              isReadOnly
              description="钱包地址无法修改，由连接的钱包决定"
            />
          </CornerFrame>

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
              {updateUser.isPending ? "保存中..." : "保存资料"}
            </AppBtn>
            <AppBtn
              btnProps={{
                as: Link,
                href: "/",
                color: "default",
                variant: "bordered",
                className: "flex-1",
                size: "lg",
              }}
            >
              取消
            </AppBtn>
          </div>
        </form>
      </div>
    </div>
  );
} 