"use client";

import Link from "next/link";
import { useState } from "react";
import { api } from "~/trpc/react";

export default function GrantsPoolPage() {
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<"ACTIVE" | "INACTIVE" | "ARCHIVED" | "">("");
  const [selectedChain, setSelectedChain] = useState<"ETHEREUM" | "OPTIMISM" | "">("");

  const { data, isLoading, error } = api.grantsPool.getAll.useQuery({
    search: search || undefined,
    status: selectedStatus || undefined,
    chainType: selectedChain || undefined,
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
      ACTIVE: "bg-green-100 text-green-800",
      INACTIVE: "bg-yellow-100 text-yellow-800",
      ARCHIVED: "bg-gray-100 text-gray-800",
    };
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const getStatusText = (status: string) => {
    const texts = {
      ACTIVE: "活跃",
      INACTIVE: "停用",
      ARCHIVED: "归档",
    };
    return texts[status as keyof typeof texts] || status;
  };

  const getChainColor = (chainType: string) => {
    const colors = {
      ETHEREUM: "bg-blue-100 text-blue-800",
      OPTIMISM: "bg-red-100 text-red-800",
    };
    return colors[chainType as keyof typeof colors] || "bg-gray-100 text-gray-800";
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
        <h1 className="text-3xl font-bold text-gray-900">Grants Pool 列表</h1>
        <Link
          href="/grants-pool/create"
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          创建 Grants Pool
        </Link>
      </div>

      {/* 搜索和筛选 */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              搜索Grants Pool
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索名称或描述..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              状态筛选
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as "ACTIVE" | "INACTIVE" | "ARCHIVED" | "")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">全部状态</option>
              <option value="ACTIVE">活跃</option>
              <option value="INACTIVE">停用</option>
              <option value="ARCHIVED">归档</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              链类型筛选
            </label>
            <select
              value={selectedChain}
              onChange={(e) => setSelectedChain(e.target.value as "ETHEREUM" | "OPTIMISM" | "")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">全部链</option>
              <option value="ETHEREUM">以太坊</option>
              <option value="OPTIMISM">Optimism</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grants Pool列表 */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
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
          {data?.grantsPools?.map((gp) => (
            <Link
              key={gp.id}
              href={`/grants-pool/${gp.id}`}
              className="bg-white p-6 rounded-lg shadow-md border hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {gp.avatar && (
                    <img
                      src={gp.avatar}
                      alt={gp.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  )}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                      {gp.name}
                    </h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <span
                        className={`inline-block px-2 py-1 text-xs rounded-full ${getStatusColor(gp.status)}`}
                      >
                        {getStatusText(gp.status)}
                      </span>
                      <span
                        className={`inline-block px-2 py-1 text-xs rounded-full ${getChainColor(gp.chainType)}`}
                      >
                        {gp.chainType === "ETHEREUM" ? "以太坊" : "Optimism"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                {gp.description}
              </p>

              {gp.tags && (
                <div className="mb-4">
                  <div className="flex flex-wrap gap-1">
                    {gp.tags.split(",").slice(0, 3).map((tag, index) => (
                      <span
                        key={index}
                        className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
                      >
                        {tag.trim()}
                      </span>
                    ))}
                    {gp.tags.split(",").length > 3 && (
                      <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                        +{gp.tags.split(",").length - 3}
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-2 text-xs text-gray-500">
                <div className="flex items-center justify-between">
                  <span>创建者: {gp.owner.name || "匿名用户"}</span>
                  <span>{formatDate(gp.createdAt)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>国库钱包: {gp.treasuryWallet.slice(0, 6)}...{gp.treasuryWallet.slice(-4)}</span>
                  {gp._count.pods > 0 && (
                    <span>Pod数: {gp._count.pods}</span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {!isLoading && (!data?.grantsPools || data.grantsPools.length === 0) && (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg mb-4">
            {search || selectedStatus || selectedChain ? "没有找到符合条件的Grants Pool" : "暂无Grants Pool"}
          </div>
          <Link
            href="/grants-pool/create"
            className="text-blue-600 hover:text-blue-700"
          >
            创建第一个 Grants Pool
          </Link>
        </div>
      )}
    </div>
  );
} 