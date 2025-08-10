"use client";

import { useMemo } from "react";
import CornerFrame from "~/components/corner-frame";
import AppBtn from "~/components/app-btn";
import GrantspoolItem from "~/components/grantspool-item";
import NextLink from 'next/link';
import { api } from "~/trpc/react";
import LoadingSkeleton from "~/components/loading-skeleton";
import Empty from "~/components/empty";

export default function MyGrantsPoolPage() {
  // 获取当前用户创建的 grants pools 数据
  const { data: grantsPoolsData, isLoading, error } = api.grantsPool.getMyGrantsPools.useQuery();


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
          {grantsPoolsData && grantsPoolsData.length > 0 ? (
            grantsPoolsData.map((grantsPool) => (
              <GrantspoolItem
                key={grantsPool.id}
                grantsPool={grantsPool}
                className="fadeIn"
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