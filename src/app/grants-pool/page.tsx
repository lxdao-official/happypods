"use client";

import { useMemo } from "react";
import CornerFrame from "~/components/corner-frame";
import AppBtn from "~/components/app-btn";
import GrantspoolItem from "~/components/grantspool-item";
import NextLink from 'next/link';
import { api } from "~/trpc/react";
import Empty from "~/components/empty";
import LoadingSkeleton from "~/components/loading-skeleton";

export default function GrantsPoolPage() {
  // 获取所有 grants pools 数据（不使用分页，获取全部）
  const { data: grantsPoolsData, isLoading } = api.grantsPool.getAll.useQuery({
    limit: 100, // 设置一个较大的限制值来获取所有数据
  });


  // 优化后：直接使用后端数据，在组件内部处理必要的数据转换
  const grantsPools = grantsPoolsData?.grantsPools || [];

  return (
    <div className="p-6 mb-8">
      <div className="mx-auto max-w-7xl">
        {/* 顶部横幅 */}
        <CornerFrame className="mb-20"> 
          <div className="flex flex-col items-center justify-center gap-6 md:py-8 text-2xl text-center">
            <div className="mb-8">Discover and manage all available Grants Pools. Empower your project with community funding!</div>
            <NextLink href="/grants-pool/create" className="absolute bottom-[-25px]">
              <AppBtn btnProps={{color:"success"}}>Create Grant Pool</AppBtn>
            </NextLink>
          </div>
        </CornerFrame>


        {
          isLoading ? <LoadingSkeleton /> : 
          grantsPools.length === 0 ? <Empty /> : null
        }

        {/* Grants Pool 列表 */}
        <div className="space-y-8">
          {grantsPools.length > 0 && (
            grantsPools.map((grantsPool) => (
              <GrantspoolItem
                key={grantsPool.id}
                grantsPool={grantsPool}
                className="fadeIn"
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}