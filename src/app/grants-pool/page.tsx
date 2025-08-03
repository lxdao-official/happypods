"use client";

import { useMemo } from "react";
import CornerFrame from "~/components/corner-frame";
import AppBtn from "~/components/app-btn";
import GrantspoolItem from "~/components/grantspool-item";
import NextLink from 'next/link';
import { api } from "~/trpc/react";
import Empty from "~/components/Empty";
import LoadingSkeleton from "~/components/LoadingSkeleton";

export default function GrantsPoolPage() {
  // 获取所有 grants pools 数据（不使用分页，获取全部）
  const { data: grantsPoolsData, isLoading, error } = api.grantsPool.getAll.useQuery({
    limit: 100, // 设置一个较大的限制值来获取所有数据
  });


  console.log('grantsPoolsData==>',grantsPoolsData);

  // 转换数据格式以适配 GrantspoolItem 组件
  const transformedGrantsPools = useMemo(() => {
    if (!grantsPoolsData?.grantsPools) return [];

    return grantsPoolsData.grantsPools.map((pool) => {
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



  return (
    <div className="p-6 mb-8">
      <div className="mx-auto max-w-7xl">
        {/* 顶部横幅 */}
        <CornerFrame className="mb-20"> 
          <div className="flex flex-col items-center justify-center gap-6 py-8 text-2xl text-center">
            <div className="mb-8">Discover and manage all available Grants Pools. Empower your project with community funding!</div>
            <NextLink href="/grants-pool/create" className="absolute bottom-[-25px]">
              <AppBtn btnProps={{color:"success"}}>Create Grant Pool</AppBtn>
            </NextLink>
          </div>
        </CornerFrame>


        {
          isLoading ? <LoadingSkeleton /> : 
          transformedGrantsPools.length === 0 ? <Empty /> : null
        }

        {/* Grants Pool 列表 */}
        <div className="space-y-8">
          {transformedGrantsPools.length > 0 && (
            transformedGrantsPools.map((grantsPool) => (
              <GrantspoolItem
                key={grantsPool.id}
                grantsPool={grantsPool}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}