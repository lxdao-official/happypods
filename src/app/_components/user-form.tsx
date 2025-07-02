"use client";

import { useState, useEffect } from "react";
import { api } from "~/trpc/react";

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
  id?: number;
  avatar: string;
  name: string;
  email: string;
  role: "ADMIN" | "GP_MOD" | "APPLICANT" | "VIEWER";
  description: string;
  links: UserLinks;
}

export function UserForm() {
  const [formData, setFormData] = useState<FormData>({
    avatar: "",
    name: "",
    email: "",
    role: "APPLICANT",
    description: "",
    links: {},
  });

  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchEmail, setSearchEmail] = useState("");

  const utils = api.useUtils();

  // 创建用户
  const createUser = api.user.create.useMutation({
    onSuccess: async () => {
      await utils.user.invalidate();
      resetForm();
      alert("用户创建成功！");
    },
    onError: (error: any) => {
      alert(`创建失败：${error.message}`);
    },
  });

  // 更新用户
  const updateUser = api.user.update.useMutation({
    onSuccess: async () => {
      await utils.user.invalidate();
      resetForm();
      alert("用户更新成功！");
    },
    onError: (error: any) => {
      alert(`更新失败：${error.message}`);
    },
  });

  // 查询用户（通过邮箱）
  const { data: searchedUser, refetch: searchUser } = api.user.getByEmail.useQuery(
    { email: searchEmail },
    { enabled: false }
  );

  // 检查邮箱是否存在
  const { data: emailExists } = api.user.checkEmailExists.useQuery(
    { email: formData.email, excludeId: editingId || undefined },
    { enabled: formData.email.length > 0 }
  );

  // 重置表单
  const resetForm = () => {
    setFormData({
      avatar: "",
      name: "",
      email: "",
      role: "APPLICANT",
      description: "",
      links: {},
    });
    setEditingId(null);
  };

  // 加载用户数据到表单
  const loadUserToForm = (user: any) => {
    setFormData({
      id: user.id,
      avatar: user.avatar || "",
      name: user.name,
      email: user.email,
      role: user.role,
      description: user.description || "",
      links: user.links || {},
    });
    setEditingId(user.id);
  };

  // 搜索用户
  const handleSearch = async () => {
    if (!searchEmail) {
      alert("请输入邮箱地址");
      return;
    }
    try {
      await searchUser();
    } catch (error) {
      alert("查询失败");
    }
  };

  // 监听搜索结果
  useEffect(() => {
    if (searchedUser) {
      loadUserToForm(searchedUser);
      setSearchEmail("");
    }
  }, [searchedUser]);

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 基本验证
    if (!formData.name.trim()) {
      alert("请输入用户名称");
      return;
    }

    if (!formData.email.trim()) {
      alert("请输入邮箱地址");
      return;
    }

    if (emailExists && !editingId) {
      alert("该邮箱已被使用");
      return;
    }

    const submitData = {
      avatar: formData.avatar || undefined,
      name: formData.name.trim(),
      email: formData.email.trim(),
      role: formData.role,
      description: formData.description.trim() || undefined,
      links: Object.keys(formData.links).length > 0 ? formData.links : undefined,
    };

    if (editingId) {
      // 更新用户
      updateUser.mutate({
        id: editingId,
        ...{
          ...submitData,
          links: submitData.links as Record<string, string> | undefined
        }
      });
    } else {
      // 创建用户
      createUser.mutate({
        ...submitData,
        links: submitData.links as Record<string, string> | undefined
      });
    }
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

  const isLoading = createUser.isPending || updateUser.isPending;

  return (
    <div className="space-y-6">
      {/* 搜索区域 */}
      <div className="border border-white/20 rounded-lg p-4 bg-white/5">
        <h3 className="text-lg font-semibold mb-3">查询用户</h3>
        <div className="flex gap-3">
          <input
            type="email"
            placeholder="输入邮箱地址查询用户"
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-white/50 focus:border-violet-400 focus:outline-none"
          />
          <button
            type="button"
            onClick={handleSearch}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-700 rounded-md font-medium transition-colors"
          >
            查询
          </button>
        </div>
      </div>

      {/* 表单区域 */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">
            {editingId ? "编辑用户" : "新增用户"}
          </h3>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="px-3 py-1 text-sm bg-gray-600 hover:bg-gray-700 rounded transition-colors"
            >
              新增用户
            </button>
          )}
        </div>

        {/* 头像 */}
        <div>
          <label className="block text-sm font-medium mb-2">头像链接</label>
          <input
            type="url"
            value={formData.avatar}
            onChange={(e) => setFormData(prev => ({ ...prev, avatar: e.target.value }))}
            placeholder="https://example.com/avatar.jpg"
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-white/50 focus:border-violet-400 focus:outline-none"
          />
        </div>

        {/* 用户名称 */}
        <div>
          <label className="block text-sm font-medium mb-2">
            用户名称 <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="请输入用户名称"
            required
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-white/50 focus:border-violet-400 focus:outline-none"
          />
        </div>

        {/* 邮箱 */}
        <div>
          <label className="block text-sm font-medium mb-2">
            邮箱地址 <span className="text-red-400">*</span>
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            placeholder="请输入邮箱地址"
            required
            className={`w-full px-3 py-2 bg-white/10 border rounded-md text-white placeholder-white/50 focus:outline-none ${
              emailExists && !editingId 
                ? "border-red-400 focus:border-red-400" 
                : "border-white/20 focus:border-violet-400"
            }`}
          />
          {emailExists && !editingId && (
            <p className="text-red-400 text-sm mt-1">该邮箱已被使用</p>
          )}
        </div>

        {/* 用户角色 */}
        <div>
          <label className="block text-sm font-medium mb-2">
            用户角色 <span className="text-red-400">*</span>
          </label>
          <select
            value={formData.role}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              role: e.target.value as FormData["role"]
            }))}
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white focus:border-violet-400 focus:outline-none"
          >
            {USER_ROLES.map(role => (
              <option key={role.value} value={role.value} className="bg-gray-800">
                {role.label}
              </option>
            ))}
          </select>
        </div>

        {/* 用户描述 */}
        <div>
          <label className="block text-sm font-medium mb-2">用户描述</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="请输入用户描述"
            rows={3}
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-white/50 focus:border-violet-400 focus:outline-none resize-none"
          />
        </div>

        {/* 社交链接 */}
        <div>
          <label className="block text-sm font-medium mb-2">社交链接</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="url"
              value={formData.links.x || ""}
              onChange={(e) => updateLink("x", e.target.value)}
              placeholder="X (Twitter) 链接"
              className="px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-white/50 focus:border-violet-400 focus:outline-none"
            />
            <input
              type="url"
              value={formData.links.telegram || ""}
              onChange={(e) => updateLink("telegram", e.target.value)}
              placeholder="Telegram 链接"
              className="px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-white/50 focus:border-violet-400 focus:outline-none"
            />
            <input
              type="url"
              value={formData.links.github || ""}
              onChange={(e) => updateLink("github", e.target.value)}
              placeholder="GitHub 链接"
              className="px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-white/50 focus:border-violet-400 focus:outline-none"
            />
            <input
              type="url"
              value={formData.links.website || ""}
              onChange={(e) => updateLink("website", e.target.value)}
              placeholder="个人网站"
              className="px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-white/50 focus:border-violet-400 focus:outline-none"
            />
          </div>
        </div>

        {/* 提交按钮 */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isLoading || (emailExists && !editingId)}
            className="flex-1 py-2 px-4 bg-violet-600 hover:bg-violet-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-md font-medium transition-colors"
          >
            {isLoading 
              ? (editingId ? "更新中..." : "创建中...") 
              : (editingId ? "更新用户" : "创建用户")
            }
          </button>
          
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-md font-medium transition-colors"
            >
              取消
            </button>
          )}
        </div>
      </form>

      {/* 用户信息预览 */}
      {editingId && (
        <div className="border border-white/20 rounded-lg p-4 bg-white/5">
          <h3 className="text-lg font-semibold mb-3">当前编辑用户信息</h3>
          <div className="space-y-2 text-sm">
            <p><span className="text-white/70">ID:</span> {editingId}</p>
            <p><span className="text-white/70">邮箱:</span> {formData.email}</p>
            <p><span className="text-white/70">角色:</span> {USER_ROLES.find(r => r.value === formData.role)?.label}</p>
          </div>
        </div>
      )}
    </div>
  );
} 