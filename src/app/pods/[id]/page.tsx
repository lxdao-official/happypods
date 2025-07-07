"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "~/trpc/react";

export default function PodDetailPage() {
  const params = useParams();
  const podId = parseInt(params.id as string);

  const { data: pod, isLoading, error } = api.pod.getById.useQuery({ id: podId });

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
      REVIEWING: "bg-yellow-100 text-yellow-800 border-yellow-200",
      APPROVED: "bg-green-100 text-green-800 border-green-200",
      REJECTED: "bg-red-100 text-red-800 border-red-200",
      IN_PROGRESS: "bg-blue-100 text-blue-800 border-blue-200",
      COMPLETED: "bg-purple-100 text-purple-800 border-purple-200",
      TERMINATED: "bg-gray-100 text-gray-800 border-gray-200",
    };
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getStatusText = (status: string) => {
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

  if (error || !pod) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="text-red-600 text-lg mb-4">
            {error?.message ?? "Pod不存在"}
          </div>
          <Link
            href="/pods"
            className="text-blue-600 hover:text-blue-700"
          >
            返回Pod列表
          </Link>
        </div>
      </div>
    );
  }

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

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Pod头部信息 */}
        <div className="p-6 border-b">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-4">
              {pod.avatar && (
                <img
                  src={pod.avatar}
                  alt={pod.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {pod.name}
                </h1>
                <span
                  className={`inline-block px-3 py-1 text-sm rounded-full border ${getStatusColor(pod.status)}`}
                >
                  {getStatusText(pod.status)}
                </span>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">申请人信息</h3>
              <div className="flex items-center space-x-3">
                {pod.applicant.avatar && (
                  <img
                    src={pod.applicant.avatar}
                    alt={pod.applicant.name ?? "申请人"}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                )}
                <span className="text-gray-700">
                  {pod.applicant.name ?? "匿名用户"}
                </span>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Grants Pool</h3>
              <Link
                href={`/grants-pool/${pod.grantsPool.id}`}
                className="flex items-center space-x-3 text-blue-600 hover:text-blue-700"
              >
                {pod.grantsPool.avatar && (
                  <img
                    src={pod.grantsPool.avatar}
                    alt={pod.grantsPool.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                )}
                <span>{pod.grantsPool.name}</span>
              </Link>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-600">
            <div>
              <span className="font-medium">RFP索引:</span> {pod.rfpIndex}
            </div>
            <div>
              <span className="font-medium">申请币种:</span> {pod.currency}
            </div>
            <div>
              <span className="font-medium">创建时间:</span> {formatDate(pod.createdAt)}
            </div>
          </div>
        </div>

        {/* 简短描述 */}
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">简短描述</h2>
          <p className="text-gray-700 leading-relaxed">{pod.shortDescription}</p>
        </div>

        {/* 详细描述 */}
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">详细描述</h2>
          <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
            {pod.detailDescription}
          </div>
        </div>

        {/* 链接信息 */}
        {pod.links && (
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">相关链接</h2>
            <div className="space-y-2">
              {Object.entries(pod.links as Record<string, string>).map(([key, value]) => (
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

        {/* 里程碑 */}
        {pod.milestones && pod.milestones.length > 0 && (
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              里程碑 ({pod.milestones.length})
            </h2>
            <div className="space-y-4">
              {pod.milestones.map((milestone, index) => (
                <div
                  key={milestone.id}
                  className="border rounded-lg p-4 bg-gray-50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900">
                      里程碑 {index + 1}
                    </h3>
                    <div className="flex items-center space-x-2 text-sm">
                      <span
                        className={`px-2 py-1 rounded ${
                          milestone.status === "ACTIVE"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {milestone.status === "ACTIVE" ? "活跃" : "已失效"}
                      </span>
                      <span className="text-gray-600">
                        {milestone.currentPhase}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    创建时间: {formatDate(milestone.createdAt)}
                  </div>
                  {milestone.associatedWallet && (
                    <div className="text-sm text-gray-600 mt-1">
                      关联钱包: {milestone.associatedWallet}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 