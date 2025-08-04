"use client";

import { useMemo } from "react";
import CornerFrame from "~/components/corner-frame";
import AppBtn from "~/components/app-btn";
import GrantspoolItem from "~/components/grantspool-item";
import NextLink from 'next/link';
import { api } from "~/trpc/react";
import LoadingSkeleton from "~/components/LoadingSkeleton";
import Empty from "~/components/Empty";

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
      const treasuryBalances = pool.treasuryBalances as Record<string, {available: string, used: string, locked: string}> | undefined;
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

  if (isLoading || error) {
    return (
      <div className="container py-6 mx-auto">
        <LoadingSkeleton/>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="container mx-auto">
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
           <Empty/>
          )}
        </div>
      </div>
    </div>
  );
}