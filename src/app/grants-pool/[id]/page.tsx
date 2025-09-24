'use client';
import { useParams } from "next/navigation";
import GrantspoolItem from "~/components/grantspool-item";
import { DataDisplayGrid } from "~/components/data-display-grid";
import EdgeLine from "~/components/edge-line";
import { api } from "~/trpc/react";
import { useAccount } from "wagmi";
import LoadingSkeleton from "~/components/loading-skeleton";
import EmptyReplace from "~/components/empty-replace";
import { useMobile } from "~/hooks/useMobile";
import { useSEO } from "~/hooks/useSeo";
import { markdownToText } from "~/lib/utils";

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


  const isMobile = useMobile();

  // 设置动态 TDK
  useSEO("grants-pool", grantsPool ? {
    title: `${grantsPool.name} - HappyPods`,
    description: markdownToText(grantsPool.description).substring(0, 160),
    keywords: ['Grant Pool', grantsPool.name, 'Web3', 'DAO', ...(grantsPool.tags?.split(',') || [])]
  } : undefined);

  // 加载状态
  if (isLoading || error) {
    return (
      <div className="container"><LoadingSkeleton/></div>
    );
  }


  // 数据不存在
  if (!grantsPool) {
    return <div className="container"><EmptyReplace/></div>;
  }



  return (
    <div className="container">
      <GrantspoolItem grantsPool={grantsPool} type="detail" className="fadeIn" />
      <div className="mt-10">
        <DataDisplayGrid title={`${isMobile ? "" : grantsPool.name+' '} Pods`} type="gp" sortClassName="text-black" grantsPoolId={grantsPoolId}/>
      </div>
    </div>
  );
};

export default GrantsPoolDetailPage;