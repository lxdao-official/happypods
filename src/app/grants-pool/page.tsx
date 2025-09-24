"use client";

import { useMemo } from "react";
import CornerFrame from "~/components/corner-frame";
import AppBtn from "~/components/app-btn";
import GrantspoolItem from "~/components/grantspool-item";
import NextLink from 'next/link';
import { api } from "~/trpc/react";
import EmptyReplace from "~/components/empty-replace";
import LoadingSkeleton from "~/components/loading-skeleton";
import RequireLogin from "~/components/require-login";
export default function GrantsPoolPage() {

  // 获取所有 grants pools 数据（不使用分页，获取全部）
  const { data: grantsPoolsData, isLoading } = api.grantsPool.getAll.useQuery({
    limit: 100, // 设置一个较大的限制值来获取所有数据
  });


  // 优化后：直接使用后端数据，在组件内部处理必要的数据转换
  const grantsPools = grantsPoolsData?.grantsPools || [];

  return (
    <div className="container">
      <div className="mx-auto">
        {/* 顶部横幅 */}
        <CornerFrame className="mb-20" style="border"> 
          <div className="flex flex-col items-center justify-center gap-6 text-2xl text-center md:py-8">
            <div className="mb-8 text-xl md:text-2xl">Browse funding pools and RFPs from foundations, DAOs, and organizations</div>
            {/* <RequireLogin> */}
              <NextLink href="/grants-pool/create" className="absolute bottom-[-25px]">
                <AppBtn btnProps={{color:"success"}}>Create Grant Pool</AppBtn>
              </NextLink>
            {/* </RequireLogin> */}
          </div>
        </CornerFrame>


        {
          isLoading ? <LoadingSkeleton /> : 
          grantsPools.length === 0 ? <EmptyReplace /> : null
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