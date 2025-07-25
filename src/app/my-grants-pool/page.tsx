"use client";

import { useMemo } from "react";
import CornerFrame from "~/components/corner-frame";
import AppBtn from "~/components/app-btn";
import GrantspoolItem from "~/components/grantspool-item";
import NextLink from 'next/link';
import { api } from "~/trpc/react";

export default function MyGrantsPoolPage() {
  // 获取当前用户创建的 grants pools 数据
  const { data: grantsPoolsData, isLoading, error } = api.grantsPool.getMyGrantsPools.useQuery();

  console.log('myGrantsPoolsData==>', grantsPoolsData);

  // 转换数据格式以适配 GrantspoolItem 组件
  const transformedGrantsPools = useMemo(() => {
    if (!grantsPoolsData) return [];

    return grantsPoolsData.map((pool) => {
      // links 直接传递
      const links = pool.links as Record<string, string> | undefined;
      // 解析 tags 为 categories
      const categories = pool.tags ? pool.tags.split(',').map(tag => tag.trim()) : [];
      // treasuryBalances 直接传递
      const treasuryBalances = pool.treasuryBalances as Record<string, string> | undefined;
      // proposals
      const proposals = pool.rfps.map(rfp => ({
        id: rfp.id,
        title: rfp.title,
        description: rfp.description                           
      }));
      return {
        id: pool.id,
        avatar: pool.avatar ?? null,
        name: pool.name,
        description: pool.description,
        logo: pool.avatar ?? undefined,
        links,
        treasuryBalances,
        categories: categories.length > 0 ? categories : ["Default"],
        proposals,
      };
    });
  }, [grantsPoolsData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6">
        <div className="text-xl">Loading My Grants Pools...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6">
        <div className="text-xl text-red-500">Failed to load: {error.message}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="mx-auto max-w-7xl">
        {/* Grants Pool 列表 */}
        <div className="space-y-8">
          {transformedGrantsPools.length > 0 ? (
            transformedGrantsPools.map((grantsPool) => (
              <GrantspoolItem
                key={grantsPool.id}
                grantsPool={grantsPool}
              />
            ))
          ) : (
            <div className="py-12 text-center">
              <div className="text-xl text-gray-500">You haven't created any Grants Pool yet</div>
              <NextLink href="/grants-pool/create" className="mt-4">
                <AppBtn btnProps={{color:"primary"}}>Create Your First Grant Pool</AppBtn>
              </NextLink>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}