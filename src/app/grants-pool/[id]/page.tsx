'use client';
import { useParams } from "next/navigation";
import GrantspoolItem from "~/components/grantspool-item";
import { DataDisplayGrid } from "~/components/data-display-grid";
import EdgeLine from "~/components/edge-line";
import { api } from "~/trpc/react";
import { useAccount } from "wagmi";

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
  if (isLoading) {
    return (
      <div className="container flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-8 h-8 mx-auto border-b-2 border-gray-900 rounded-full animate-spin"></div>
          <p className="mt-2 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div className="container flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="mb-2 text-xl font-bold text-red-600">加载失败</h2>
          <p className="text-gray-600">{error.message}</p>
        </div>
      </div>
    );
  }

  // 数据不存在
  if (!grantsPool) {
    return (
      <div className="container flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="mb-2 text-xl font-bold text-gray-600">GrantsPool不存在</h2>
        </div>
      </div>
    );
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
    <div className="container">
      <GrantspoolItem grantsPool={transformedGrantsPool} type="detail">
        <div className="mt-20">
          <EdgeLine color="black"/>
          <DataDisplayGrid title="Pods" sortClassName="text-black" type="gp" grantsPoolId={grantsPoolId}/>
        </div>
      </GrantspoolItem> 
    </div>
  );
};

export default GrantsPoolDetailPage;