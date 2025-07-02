"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "~/trpc/react";

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
    website: "",
    github: "",
    twitter: "",
    telegram: "",
  });

  const { data: grantsPools, isLoading: grantsPoolsLoading } = api.grantsPool.getActiveGrantsPools.useQuery();
  const createPodMutation = api.pod.create.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.grantsPoolId || !formData.name || !formData.shortDescription || !formData.detailDescription || !formData.currency) {
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

      await createPodMutation.mutateAsync({
        grantsPoolId: parseInt(formData.grantsPoolId),
        rfpIndex: parseInt(formData.rfpIndex) || 0,
        avatar: formData.avatar || undefined,
        name: formData.name,
        shortDescription: formData.shortDescription,
        detailDescription: formData.detailDescription,
        currency: formData.currency,
        links: Object.keys(links).length > 0 ? links : undefined,
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
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link
          href="/pods"
          className="text-blue-600 hover:text-blue-700 text-sm"
        >
          ← 返回Pod列表
        </Link>
      </div>

      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">创建Pod项目</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 选择Grants Pool */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              选择Grants Pool <span className="text-red-500">*</span>
            </label>
            {grantsPoolsLoading ? (
              <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
                加载中...
              </div>
            ) : (
              <select
                value={formData.grantsPoolId}
                onChange={(e) => handleInputChange("grantsPoolId", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              >
                <option value="">请选择Grants Pool</option>
                {grantsPools?.map((gp) => (
                  <option key={gp.id} value={gp.id}>
                    {gp.name} ({gp.chainType})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* RFP索引 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              RFP索引
            </label>
            <input
              type="number"
              value={formData.rfpIndex}
              onChange={(e) => handleInputChange("rfpIndex", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="0"
              min="0"
            />
          </div>

          {/* Pod头像 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pod头像链接
            </label>
            <input
              type="url"
              value={formData.avatar}
              onChange={(e) => handleInputChange("avatar", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="https://example.com/avatar.jpg"
            />
          </div>

          {/* Pod名称 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pod名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="输入Pod名称"
              required
            />
          </div>

          {/* 简短描述 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              简短描述 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.shortDescription}
              onChange={(e) => handleInputChange("shortDescription", e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="简要描述您的项目"
              required
            />
          </div>

          {/* 详细描述 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              详细描述 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.detailDescription}
              onChange={(e) => handleInputChange("detailDescription", e.target.value)}
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="详细描述您的项目，包括目标、实现方案、预期成果等"
              required
            />
          </div>

          {/* 申请币种 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              申请币种 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.currency}
              onChange={(e) => handleInputChange("currency", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="如: ETH, USDC, DAI"
              required
            />
          </div>

          {/* 相关链接 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">相关链接</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                官方网站
              </label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => handleInputChange("website", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="https://t.me/yourproject"
              />
            </div>
          </div>

          {/* 提交按钮 */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? "创建中..." : "创建Pod"}
            </button>
            <Link
              href="/pods"
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