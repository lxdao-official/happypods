"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "~/trpc/react";

export default function GrantsPoolDetailPage() {
  const params = useParams();
  const grantsPoolId = parseInt(params.id as string);

  const { data: grantsPool, isLoading, error } = api.grantsPool.getById.useQuery({ id: grantsPoolId });

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  const getStatusColor = (status: string) => {
    const colors = {
      ACTIVE: "bg-green-100 text-green-800 border-green-200",
      INACTIVE: "bg-yellow-100 text-yellow-800 border-yellow-200",
      ARCHIVED: "bg-gray-100 text-gray-800 border-gray-200",
    };
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getStatusText = (status: string) => {
    const texts = {
      ACTIVE: "活跃",
      INACTIVE: "停用", 
      ARCHIVED: "归档",
    };
    return texts[status as keyof typeof texts] || status;
  };

  const getPodStatusColor = (status: string) => {
    const colors = {
      REVIEWING: "bg-yellow-100 text-yellow-800",
      APPROVED: "bg-green-100 text-green-800",
      REJECTED: "bg-red-100 text-red-800",
      IN_PROGRESS: "bg-blue-100 text-blue-800",
      COMPLETED: "bg-purple-100 text-purple-800",
      TERMINATED: "bg-gray-100 text-gray-800",
    };
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const getPodStatusText = (status: string) => {
    const texts = {
      REVIEWING: "审核中",
      APPROVED: "已通过",
      REJECTED: "已拒绝",
      IN_PROGRESS: "进行中",
      COMPLETED: "已完成",
      TERMINATED: "已终止",
    };
    return texts[status as keyof typeof texts] || status;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded mb-4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !grantsPool) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="text-red-600 text-lg mb-4">
            {error?.message ?? "Grants Pool不存在"}
          </div>
          <Link
            href="/grants-pool"
            className="text-blue-600 hover:text-blue-700"
          >
            返回Grants Pool列表
          </Link>
        </div>
      </div>
    );
  }

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

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Grants Pool头部信息 */}
        <div className="p-6 border-b">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-4">
              {grantsPool.avatar && (
                <img
                  src={grantsPool.avatar}
                  alt={grantsPool.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {grantsPool.name}
                </h1>
                <div className="flex items-center space-x-2">
                  <span
                    className={`inline-block px-3 py-1 text-sm rounded-full border ${getStatusColor(grantsPool.status)}`}
                  >
                    {getStatusText(grantsPool.status)}
                  </span>
                  <span
                    className={`inline-block px-3 py-1 text-sm rounded-full ${
                      grantsPool.chainType === "ETHEREUM" 
                        ? "bg-blue-100 text-blue-800" 
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {grantsPool.chainType === "ETHEREUM" ? "以太坊" : "Optimism"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">创建者信息</h3>
              <div className="flex items-center space-x-3">
                {grantsPool.owner.avatar && (
                  <img
                    src={grantsPool.owner.avatar}
                    alt={grantsPool.owner.name ?? "创建者"}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                )}
                <span className="text-gray-700">
                  {grantsPool.owner.name ?? "匿名用户"}
                </span>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">国库钱包</h3>
              <div className="flex items-center space-x-2">
                <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                  {grantsPool.treasuryWallet}
                </code>
                <button
                  onClick={() => navigator.clipboard.writeText(grantsPool.treasuryWallet)}
                  className="text-blue-600 hover:text-blue-700 text-sm"
                  title="复制地址"
                >
                  复制
                </button>
              </div>
            </div>
          </div>

          <div className="text-sm text-gray-600">
            <span className="font-medium">创建时间:</span> {formatDate(grantsPool.createdAt)}
          </div>
        </div>

        {/* 描述 */}
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">描述</h2>
          <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
            {grantsPool.description}
          </div>
        </div>

        {/* 标签 */}
        {grantsPool.tags && (
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">标签</h2>
            <div className="flex flex-wrap gap-2">
              {grantsPool.tags.split(",").map((tag, index) => (
                <span
                  key={index}
                  className="inline-block px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full"
                >
                  {tag.trim()}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* RFP信息 */}
        {grantsPool.rfp && (
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">RFP信息</h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                {JSON.stringify(grantsPool.rfp, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* 管理员信息 */}
        {grantsPool.modInfo && (
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">管理员信息</h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                {JSON.stringify(grantsPool.modInfo, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* 相关链接 */}
        {grantsPool.links && (
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">相关链接</h2>
            <div className="space-y-2">
              {Object.entries(grantsPool.links as Record<string, string>).map(([key, value]) => (
                <div key={key} className="flex items-center space-x-3">
                  <span className="font-medium text-gray-600 capitalize">{key}:</span>
                  <a
                    href={value}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 break-all"
                  >
                    {value}
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pod列表 */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              相关Pod ({grantsPool.pods.length})
            </h2>
            <Link
              href={`/pods/create?grantsPoolId=${grantsPool.id}`}
              className="bg-green-600 text-white px-4 py-2 rounded-md text-sm hover:bg-green-700 transition-colors"
            >
              申请Pod
            </Link>
          </div>
          
          {grantsPool.pods.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
              {grantsPool.pods.map((pod) => (
                <Link
                  key={pod.id}
                  href={`/pods/${pod.id}`}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-gray-900 line-clamp-1">
                      {pod.name}
                    </h3>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${getPodStatusColor(pod.status)}`}
                    >
                      {getPodStatusText(pod.status)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                    {pod.shortDescription}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>申请人: {pod.applicant.name ?? "匿名用户"}</span>
                    <span>币种: {pod.currency}</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              暂无Pod申请
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 