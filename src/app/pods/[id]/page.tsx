"use client";

import { useParams } from "next/navigation";
import { Chip } from "@heroui/react";
import NextLink from 'next/link';
import { formatDate, truncateString } from "~/lib/utils";
import { QRCodeTooltip } from "~/components/qr-code-tooltip";
import MilestonesSection from "~/components/milestones-section";
import CardBox from "~/components/card-box";
import EdgeLine from "~/components/edge-line";
import { ShareButton } from "~/components/share-button";
import type { PodHistoryItem } from "~/components/pod-history-section";
import PodHistorySection from "~/components/pod-history-section";
import ApplicantInfoModal from "~/components/applicant-info-modal";
import GpReviewActions from "~/components/gp-review-actions";
import { api } from "~/trpc/react";
import { MilestoneStatus } from "@prisma/client";
import StatusChip from "~/components/StatusChip";
import LoadingSkeleton from "~/components/LoadingSkeleton";
import Empty from "~/components/Empty";
import type { JsonObject, JsonValue } from "@prisma/client/runtime/library";
import JsonInfoDisplay from "~/components/json-info-display";
import type { Status } from "~/lib/config";
import { LinkDisplay } from "~/components/link-display";
import { useMemo } from "react";
import useStore from "~/store";


export default function PodDetailPage() {
  const params = useParams();
  const podId = parseInt(params.id as string);
  const { userInfo } = useStore();

  // 查询 Pod 详情
  const { data: podDetail, isLoading: isPodLoading } = api.pod.getPodDetail.useQuery(
    { id: podId },
    { enabled: !!podId }
  );

  // 查询里程碑
  const { data: milestones, isLoading: isMilestonesLoading } = api.milestone.getPodMilestones.useQuery(
    { podId },
    { enabled: !!podId }
  );

  console.log('milestones==>',milestones);

  // 查询历史记录
  const { data: podHistory, isLoading: isHistoryLoading } = api.pod.getPodHistory.useQuery(
    { podId },
    { enabled: !!podId }
  );




  if (isPodLoading || isMilestonesLoading || isHistoryLoading) {
    return <div className="container px-4 py-8 mx-auto">
      <LoadingSkeleton />
    </div>
  }

  if (!podDetail) {
    return (
      <div className="container px-4 py-8 mx-auto">
        <Empty/>
      </div>
    );
  }

  const funded = podDetail.milestones.filter(milestone => milestone.status === MilestoneStatus.COMPLETED).reduce((acc, milestone) => acc + milestone.amount, 0);
  const locked = podDetail.milestones.filter(milestone => milestone.status !== MilestoneStatus.COMPLETED).reduce((acc, milestone) => acc + milestone.amount, 0);

  // 转换数据格式以匹配现有 UI
  const pod = {
    ...podDetail,
    tags: podDetail.tags?.split(',').map(tag => tag.trim()).filter(Boolean) || [],
    treasury: {
      locked,
      funded,
      balances: podDetail.treasuryBalances
    },
  };

  // 转换历史记录数据格式
  const formattedHistory: PodHistoryItem[] = podHistory?.versions?.map(item => ({
    id: item.id,
    date: item.date,
    status: item.status,
    description: item.description
  })) || [];

  const isGpOwner = userInfo && userInfo?.id === pod.grantsPool.ownerId

  return (
    <div className="container px-4 py-8 mx-auto">

      <CardBox
      titleBg="var(--color-primary)"
      title={
       <div className="flex items-center justify-between">
         <div className="flex items-center">
            <img src={pod.avatar || ''} alt="" className="w-10 h-10 rounded-full" />
            <span className="ml-2 text-2xl font-bold">{pod.title}</span>
          </div>

         <div className="flex items-center gap-4">

          {
            isGpOwner && (
              <GpReviewActions 
                podStatus={pod.status}
                grantsPoolId={pod.grantsPool.id}
                podId={pod.id}
                podTitle={pod.title}
                podWalletAddress={pod.walletAddress}
                podCurrency={pod.currency}
              />
            ) 
          }
          
          <ShareButton 
            url={typeof window !== 'undefined' ? window.location.href : ''}
            title={`${pod.title} - ${pod.description}`}
            description={pod.description}
            size="sm"
            color="primary"
          />
         </div>
       </div>
      }
      >
        
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <div>
            <h2 className="mb-4 text-xl font-bold">Summary</h2>

            {/* 标签 */}
            <div className="flex flex-wrap gap-2 mb-3">
              {pod.tags.map((tag, index) => (
                <span 
                  key={index}
                  className="px-3 py-1 text-xs text-black border border-black rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
            
            <div className="space-y-6">
              <div>
                <p className="leading-relaxed text-secondary">
                  {pod.description}
                </p>
              </div>
            </div>
          </div>

          <EdgeLine color="var(--color-background)"/>

          <div>
            {milestones && 
            <MilestonesSection 
              milestones={milestones} 
              gpOwnerId={pod.grantsPool.ownerId} 
              podOwnerId={pod.applicant.id} 
              podCurrency={pod.currency}
            />}
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold">Treasury</span>
                <div className="flex items-center gap-1 text-sm">
                  (
                    <img src={`/tokens/${pod.currency}.svg`} alt="" className="w-4 h-4" />
                    <small>{pod.currency}</small>
                  )
                </div>
              </div>
              <div className="flex items-center gap-1 space-x-2">
                <QRCodeTooltip content={pod.walletAddress}/>
                <a href={`https://app.safe.global/home?${pod.walletAddress}`} target="_blank" rel="noopener noreferrer">
                  <i className="text-xl ri-external-link-line hover:opacity-70"></i>
                </a>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-1 text-left">
            
              <div className="p-2 text-black rounded-md">
                <div className="text-xl font-bold">{pod.treasury.balances}</div>
                <div className="text-xs text-secondary">Locked</div>
              </div>

              <div className="p-2 text-red-500 rounded-md">
                <div className="text-xl font-bold">{pod.treasury.locked}</div>
                <div className="text-xs text-secondary">Application</div>
              </div>
              
              <div className="p-2 text-green-500 rounded-md">
                <div className="text-xl font-bold">{pod.treasury.funded}</div>
                <div className="text-xs text-secondary">Funded</div>
              </div>
            </div>
          </div>

          <EdgeLine color="var(--color-background)"/>

          <div>
            <h2 className="mb-4 text-xl font-bold">Project Details</h2>
              <div className="space-y-4">

                <div className="flex items-center justify-between space-x-2">
                  <div className="mb-1 text-sm text-secondary">Status</div>
                  <StatusChip status={pod.status as any} />
                </div>
                
                <div className="flex items-center justify-between space-x-2">
                  <div className="mb-1 text-sm text-secondary shrink-0">Applicant</div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 text-sm">
                      {
                        pod.applicant.avatar ? (
                          <img src={pod.applicant.avatar} alt="" className="w-6 h-6 bg-white rounded-full" />
                        ) : (
                          <i className="ri-user-2-line"></i>
                        )
                      }
                      <span>{pod.applicant.name}</span>
                    </div>
                    <ApplicantInfoModal applicant={podDetail.applicant} />
                  </div>
                </div>

                <div className="flex items-center justify-between space-x-2">
                  <div className="mb-1 text-sm text-secondary shrink-0">Grants Pool</div>
                  <div className="flex items-center gap-2">
                    <img src={pod.grantsPool.avatar || ''} alt="" className="w-6 h-6 rounded-full" />
                    <span className="text-sm">{pod.grantsPool.name}</span>
                    <NextLink href={`/grants-pool/${pod.grantsPool.id}`} target="_blank">
                      <i className="text-sm ri-external-link-line hover:opacity-70"></i>
                    </NextLink>
                  </div>
                </div>
                
                <div className="flex items-center justify-between space-x-2">
                  <div className="mb-1 text-sm text-secondary shrink-0">RFP</div>
                  <span className="text-sm">
                    {podDetail.rfp.title}
                  </span>
                </div>

                <div className="flex items-center justify-between space-x-2">
                  <div className="mb-1 text-sm text-secondary shrink-0">Created</div>
                  <span className="text-sm">
                    {formatDate(pod.createdAt.toISOString())}
                  </span>
                </div>

                {
                  Object.keys(podDetail.metadata as Record<string, any>).length > 0 &&
                  <div className="flex items-center justify-between space-x-2">
                    <div className="mb-1 text-sm shrink-0 text-secondary">Extra info</div>
                    <JsonInfoDisplay data={podDetail.metadata as Record<string, any>} nameMapping={{
                      rejectReason: "Reject Reason"
                    }}/>
                  </div>
                }

              </div>
            </div>

            <EdgeLine color="var(--color-background)"/>

            {pod.links && (
              <div>
                <h2 className="mb-4 text-xl font-bold">Links</h2>
                <LinkDisplay links={pod.links as Record<string, string>} theme="light" />
                
                {/* 历史版本组件 */}
                <PodHistorySection history={formattedHistory} />
              </div>
            )}
          </div>
        </div>
        
      </CardBox>

      
    </div>
  );
} 