"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "~/trpc/react";
import { getUser } from "~/lib/auth-storage";

export default function MyPodsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(getUser());

  const { data: pods, isLoading, error } = api.pod.getMyPods.useQuery(
    undefined,
    { enabled: !!currentUser?.id }
  );

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
      <div className="mb-6">
        <Link
          href="/"
          className="text-blue-600 hover:text-blue-700 text-sm"
        >
          ← 返回首页
        </Link>
      </div>

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">我的 Pod 项目</h1>
        <Link
          href="/pods/create"
          className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          创建新 Pod
        </Link>
      </div>

      {/* 用户信息卡片 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center space-x-3">
          {(currentUser as { avatar?: string }).avatar && (
            <img
              src={(currentUser as { avatar?: string }).avatar}
              alt={currentUser.name}
              className="w-12 h-12 rounded-full object-cover"
            />
          )}
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {currentUser.name}
            </h2>
            <p className="text-sm text-gray-600">
              钱包地址: {currentUser.address?.slice(0, 6)}...{currentUser.address?.slice(-4)}
            </p>
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
      ) : pods && pods.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pods.map((pod) => (
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
                  <span>申请币种: {pod.currency}</span>
                  <span>{formatDate(pod.createdAt)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>GP: {pod.grantsPool.name}</span>
                  {pod._count.milestones > 0 && (
                    <span>里程碑: {pod._count.milestones} 个</span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg mb-4">
            您还没有创建任何Pod项目
          </div>
          <p className="text-gray-400 text-sm mb-6">
            Pod是您向Grants Pool申请资助的项目单位，每个Pod可以包含多个里程碑。
          </p>
          <Link
            href="/pods/create"
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors inline-block"
          >
            创建您的第一个 Pod
          </Link>
        </div>
      )}

      {/* 统计信息 */}
      {pods && pods.length > 0 && (
        <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">项目统计</h3>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            {['REVIEWING', 'APPROVED', 'REJECTED', 'IN_PROGRESS', 'COMPLETED', 'TERMINATED'].map((status) => {
              const count = pods.filter(pod => pod.status === status).length;
              return (
                <div key={status} className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{count}</div>
                  <div className="text-sm text-gray-600">{getStatusText(status)}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
} 