'use client';
import { useParams } from "next/navigation";
import GrantspoolItem from "~/components/grantspool-item";
import { DataDisplayGrid } from "~/components/data-display-grid";
import EdgeLine from "~/components/edge-line";
import { api } from "~/trpc/react";
import { useAccount } from "wagmi";
import LoadingSkeleton from "~/components/loading-skeleton";
import Empty from "~/components/empty";

const GrantsPoolDetailPage = () => {
  const params = useParams();
  const grantsPoolId = Number(params.id);

  // 使用tRPC查询获取GrantsPool详情
  const { data: grantsPool, isLoading, error } = api.grantsPool.getById.useQuery(
    { id: grantsPoolId },
    {
      enabled: !!grantsPoolId && !isNaN(grantsPoolId),
    }
  );

  // 加载状态
  if (isLoading || error) {
    return (
      <div className="container py-8"><LoadingSkeleton/></div>
    );
  }

  // 数据不存在
  if (!grantsPool) {
    return <div className="container py-8"><Empty/></div>;
  }



  return (
    <div className="container py-8">
      <GrantspoolItem grantsPool={grantsPool} type="detail" className="fadeIn">
        <div className="mt-20">
          <EdgeLine color="black"/>
          <DataDisplayGrid title="Pods" sortClassName="text-black" type="gp" grantsPoolId={grantsPoolId} theme="light"/>
        </div>
      </GrantspoolItem> 
    </div>
  );
};

export default GrantsPoolDetailPage;