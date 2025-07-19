"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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

  // 更新链接
  const updateLink = (key: keyof UserLinks, value: string) => {
    setFormData(prev => ({
      ...prev,
      links: {
        ...prev.links,
        [key]: value.trim() || undefined,
      }
    }));
  };

  if (!currentUser) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="text-red-600 text-lg mb-4">
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
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded mb-4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-700 text-sm"
          >
            ← 返回首页
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">个人资料</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 头像 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                头像链接
              </label>
              <input
                type="url"
                value={formData.avatar}
                onChange={(e) => setFormData(prev => ({ ...prev, avatar: e.target.value }))}
                placeholder="https://example.com/avatar.jpg"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {formData.avatar && (
                <div className="mt-2">
                  <img
                    src={formData.avatar}
                    alt="头像预览"
                    className="w-16 h-16 rounded-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>

            {/* 用户名称 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                用户名称 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="请输入用户名称"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* 邮箱 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                邮箱地址 <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="请输入邮箱地址"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* 用户角色 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                用户角色
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  role: e.target.value as FormData["role"]
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {USER_ROLES.map(role => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 用户描述 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                个人简介
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="请输入个人简介"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* 社交链接 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                社交链接
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">X (Twitter)</label>
                  <input
                    type="url"
                    value={formData.links.x ?? ""}
                    onChange={(e) => updateLink("x", e.target.value)}
                    placeholder="https://x.com/username"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Telegram</label>
                  <input
                    type="url"
                    value={formData.links.telegram ?? ""}
                    onChange={(e) => updateLink("telegram", e.target.value)}
                    placeholder="https://t.me/username"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">GitHub</label>
                  <input
                    type="url"
                    value={formData.links.github ?? ""}
                    onChange={(e) => updateLink("github", e.target.value)}
                    placeholder="https://github.com/username"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">个人网站</label>
                  <input
                    type="url"
                    value={formData.links.website ?? ""}
                    onChange={(e) => updateLink("website", e.target.value)}
                    placeholder="https://yourwebsite.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* 钱包地址显示 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                钱包地址
              </label>
              <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-600">
                {currentUser.address}
              </div>
              <p className="text-xs text-gray-500 mt-1">钱包地址无法修改</p>
            </div>

            {/* 提交按钮 */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={updateUser.isPending}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {updateUser.isPending ? "保存中..." : "保存资料"}
              </button>
              <Link
                href="/"
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors text-center"
              >
                取消
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 