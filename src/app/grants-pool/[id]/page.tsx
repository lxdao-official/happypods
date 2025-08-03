'use client';
import { useParams } from "next/navigation";
import GrantspoolItem from "~/components/grantspool-item";
import { DataDisplayGrid } from "~/components/data-display-grid";
import EdgeLine from "~/components/edge-line";
import { api } from "~/trpc/react";
import { useAccount } from "wagmi";
import LoadingSkeleton from "~/components/LoadingSkeleton";
import Empty from "~/components/Empty";

const GrantsPoolDetailPage = () => {
  const params = useParams();
  const grantsPoolId = Number(params.id);
  const { address: account } = useAccount();

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


  // 转换数据格式以匹配组件期望的结构
  const transformedGrantsPool = {
    id: grantsPool.id,
    name: grantsPool.name,
    description: grantsPool.description,
    avatar: grantsPool.avatar,
    logo: grantsPool.avatar || undefined, // 使用avatar作为logo，null转换为undefined
    links: grantsPool.links as Record<string, string> || {},
    treasuryBalances: grantsPool.treasuryBalances as Record<string, {available: string, used: string, locked: string}> || {},
    categories: grantsPool.tags ? grantsPool.tags.split(',').map(tag => tag.trim()) : [],
    proposals: grantsPool.rfps.map((rfp: { id: number; title: string; description: string }) => ({
      id: rfp.id,
      title: rfp.title,
      description: rfp.description,
      avatar: null, // RFP没有avatar字段
    })),
    isOwner: grantsPool.owner.walletAddress.toLocaleLowerCase() === account?.toLocaleLowerCase(),
  };


  return (
    <div className="container py-8">
      <GrantspoolItem grantsPool={transformedGrantsPool} type="detail">
        <div className="mt-20">
          <EdgeLine color="black"/>
          <DataDisplayGrid title="Pods" sortClassName="text-black" type="gp" grantsPoolId={grantsPoolId} theme="light"/>
        </div>
      </GrantspoolItem> 
    </div>
  );
};

export default GrantsPoolDetailPage;