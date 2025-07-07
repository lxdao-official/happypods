"use client";

import Link from "next/link";
import { useState } from "react";
import { api } from "~/trpc/react";

export default function PodsPage() {
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<"REVIEWING" | "APPROVED" | "REJECTED" | "IN_PROGRESS" | "COMPLETED" | "TERMINATED" | "">("");

  const { data, isLoading, error } = api.pod.getAll.useQuery({
    search: search || undefined,
    status: selectedStatus || undefined,
  });

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("zh-CN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(date));
  };

  const getStatusColor = (status: string) => {
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

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-600">
          加载失败: {error.message}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Pod 项目列表</h1>
        <Link
          href="/pods/create"
          className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          创建 Pod
        </Link>
      </div>

      {/* 搜索和筛选 */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              搜索项目
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索项目名称或描述..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              状态筛选
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as "REVIEWING" | "APPROVED" | "REJECTED" | "IN_PROGRESS" | "COMPLETED" | "TERMINATED" | "")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">全部状态</option>
              <option value="REVIEWING">审核中</option>
              <option value="APPROVED">已通过</option>
              <option value="REJECTED">已拒绝</option>
              <option value="IN_PROGRESS">进行中</option>
              <option value="COMPLETED">已完成</option>
              <option value="TERMINATED">已终止</option>
            </select>
          </div>
        </div>
      </div>

      {/* Pod列表 */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow-md border animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-4"></div>
              <div className="h-3 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded mb-4"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data?.pods?.map((pod) => (
            <Link
              key={pod.id}
              href={`/pods/${pod.id}`}
              className="bg-white p-6 rounded-lg shadow-md border hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {pod.avatar && (
                    <img
                      src={pod.avatar}
                      alt={pod.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  )}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                      {pod.name}
                    </h3>
                    <span
                      className={`inline-block px-2 py-1 text-xs rounded-full ${getStatusColor(pod.status)}`}
                    >
                      {getStatusText(pod.status)}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {pod.shortDescription}
              </p>

              <div className="space-y-2 text-xs text-gray-500">
                <div className="flex items-center justify-between">
                  <span>申请人: {pod.applicant.name ?? "匿名用户"}</span>
                  <span>币种: {pod.currency}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>GP: {pod.grantsPool.name}</span>
                  <span>{formatDate(pod.createdAt)}</span>
                </div>
                {pod._count.milestones > 0 && (
                  <div className="text-right">
                    里程碑: {pod._count.milestones} 个
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {!isLoading && (!data?.pods || data.pods.length === 0) && (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg mb-4">
            {search || selectedStatus ? "没有找到符合条件的项目" : "暂无项目"}
          </div>
          <Link
            href="/pods/create"
            className="text-green-600 hover:text-green-700"
          >
            创建第一个 Pod 项目
          </Link>
        </div>
      )}
    </div>
  );
} 