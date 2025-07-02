"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "~/trpc/react";

export default function CreateGrantsPoolPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    avatar: "",
    name: "",
    description: "",
    tags: "",
    treasuryWallet: "",
    chainType: "ETHEREUM" as "ETHEREUM" | "OPTIMISM",
    website: "",
    github: "",
    twitter: "",
    telegram: "",
    // RFP信息
    rfpTitle: "",
    rfpDescription: "",
    rfpRequirements: "",
    rfpReward: "",
    // 管理员信息
    modName: "",
    modEmail: "",
    modTelegram: "",
  });

  const createGrantsPoolMutation = api.grantsPool.create.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.description || !formData.treasuryWallet) {
      alert("请填写所有必需字段");
      return;
    }

    setIsSubmitting(true);
    try {
      const links = {
        ...(formData.website && { website: formData.website }),
        ...(formData.github && { github: formData.github }),
        ...(formData.twitter && { twitter: formData.twitter }),
        ...(formData.telegram && { telegram: formData.telegram }),
      };

      const rfp = {
        title: formData.rfpTitle || "默认RFP",
        description: formData.rfpDescription || "请提供RFP描述",
        requirements: formData.rfpRequirements || "请提供要求",
        reward: formData.rfpReward || "TBD",
      };

      const modInfo = {
        name: formData.modName || "未设置",
        email: formData.modEmail || "未设置",
        telegram: formData.modTelegram || "未设置",
      };

      await createGrantsPoolMutation.mutateAsync({
        avatar: formData.avatar || undefined,
        name: formData.name,
        description: formData.description,
        tags: formData.tags || undefined,
        treasuryWallet: formData.treasuryWallet,
        chainType: formData.chainType,
        links: Object.keys(links).length > 0 ? links : undefined,
        rfp,
        modInfo,
      });

      alert("Grants Pool创建成功！");
      router.push("/grants-pool");
    } catch (error) {
      console.error("创建Grants Pool失败:", error);
      alert("创建失败，请重试");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link
          href="/grants-pool"
          className="text-blue-600 hover:text-blue-700 text-sm"
        >
          ← 返回Grants Pool列表
        </Link>
      </div>

      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">创建Grants Pool</h1>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 基本信息 */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">基本信息</h2>
            
            {/* GP头像 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                GP头像链接
              </label>
              <input
                type="url"
                value={formData.avatar}
                onChange={(e) => handleInputChange("avatar", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://example.com/avatar.jpg"
              />
            </div>

            {/* GP名称 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                GP名称 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="输入Grants Pool名称"
                required
              />
            </div>

            {/* GP描述 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                GP描述 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="详细描述您的Grants Pool的目标、愿景和资助方向"
                required
              />
            </div>

            {/* 标签 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                标签
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => handleInputChange("tags", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="DeFi,Web3,DAO (用英文逗号分隔)"
              />
              <p className="text-xs text-gray-500 mt-1">用英文逗号分隔多个标签</p>
            </div>

            {/* 国库钱包 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                国库钱包地址 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.treasuryWallet}
                onChange={(e) => handleInputChange("treasuryWallet", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0x..."
                required
              />
            </div>

            {/* 链类型 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                链类型 <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.chainType}
                onChange={(e) => handleInputChange("chainType", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="ETHEREUM">以太坊主网</option>
                <option value="OPTIMISM">Optimism网络</option>
              </select>
            </div>
          </div>

          {/* RFP信息 */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">RFP信息</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                RFP标题
              </label>
              <input
                type="text"
                value={formData.rfpTitle}
                onChange={(e) => handleInputChange("rfpTitle", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="RFP标题"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                RFP描述
              </label>
              <textarea
                value={formData.rfpDescription}
                onChange={(e) => handleInputChange("rfpDescription", e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="描述RFP的背景和目标"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                申请要求
              </label>
              <textarea
                value={formData.rfpRequirements}
                onChange={(e) => handleInputChange("rfpRequirements", e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="列出对申请者的具体要求"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                奖励信息
              </label>
              <input
                type="text"
                value={formData.rfpReward}
                onChange={(e) => handleInputChange("rfpReward", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="如：10,000 USDC 或 待定"
              />
            </div>
          </div>

          {/* 管理员信息 */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">管理员信息</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                管理员姓名
              </label>
              <input
                type="text"
                value={formData.modName}
                onChange={(e) => handleInputChange("modName", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="管理员姓名"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                管理员邮箱
              </label>
              <input
                type="email"
                value={formData.modEmail}
                onChange={(e) => handleInputChange("modEmail", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="admin@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                管理员Telegram
              </label>
              <input
                type="text"
                value={formData.modTelegram}
                onChange={(e) => handleInputChange("modTelegram", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="@username"
              />
            </div>
          </div>

          {/* 相关链接 */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">相关链接</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                官方网站
              </label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => handleInputChange("website", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://yourproject.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                GitHub
              </label>
              <input
                type="url"
                value={formData.github}
                onChange={(e) => handleInputChange("github", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://github.com/yourproject"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Twitter
              </label>
              <input
                type="url"
                value={formData.twitter}
                onChange={(e) => handleInputChange("twitter", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://twitter.com/yourproject"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Telegram
              </label>
              <input
                type="url"
                value={formData.telegram}
                onChange={(e) => handleInputChange("telegram", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://t.me/yourproject"
              />
            </div>
          </div>

          {/* 提交按钮 */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? "创建中..." : "创建Grants Pool"}
            </button>
            <Link
              href="/grants-pool"
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors text-center"
            >
              取消
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
} 