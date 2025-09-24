"use client";

import { useParams } from "next/navigation";
import NextLink from 'next/link';
import { formatDate, formatRelativeTime, formatToken, getColorFromString, markdownToText } from "~/lib/utils";
import { QRCodeTooltip } from "~/components/qr-code-tooltip";
import MilestonesSection from "~/components/milestones-section";
import CardBox from "~/components/card-box";
import EdgeLine from "~/components/edge-line";
import { ShareButton } from "~/components/share-button";
import PodHistorySection from "~/components/pod-history-section";
import ApplicantInfoModal from "~/components/applicant-info-modal";
import GpReviewActions from "~/components/gp-review-actions";
import FundInjectionWarning from "~/components/fund-injection-warning";
import RefundWarning from "~/components/refund-warning";
import { api } from "~/trpc/react";
import { MilestoneStatus, PodStatus } from "@prisma/client";
import StatusChip from "~/components/status-chip";
import LoadingSkeleton from "~/components/loading-skeleton";
import { LinkDisplay } from "~/components/link-display";
import { useEffect, useMemo, useState } from "react";
import useStore from "~/store";
import Tag from "~/components/tag";
import PodMilestoneTimeoutActions from "~/components/pod-milestone-timeout-actions";
import { FEE_CONFIG } from "~/lib/config";
import { getSafeWalletOwners } from "~/lib/safeUtils";
import TooltipWrap from "~/components/TooltipInfo";
import Decimal from "decimal.js";
import LazyImage from "~/components/LazyImage";
import MdTextPreviewModal from "~/components/md-text-preview-modal";
import ExpandableText from "~/components/expandable-text";
import { useSEO } from "~/hooks/useSeo";


export default function PodDetailPage() {
  const params = useParams();
  const podId = parseInt(params.id as string);
  const { userInfo,podDetailRefreshKey } = useStore();

  // 查询 Pod 详情
  const { data: podDetail, isLoading: isPodLoading, refetch: refetchPodDetail } = api.pod.getPodDetail.useQuery(
    { id: podId },
    { enabled: !!podId }
  );

  // 查询里程碑
  const { data: milestones, isLoading: isMilestonesLoading, refetch: refetchMilestones } = api.milestone.getPodMilestones.useQuery(
    { podId },
    { enabled: !!podId }
  );

  useEffect(()=>{
    refetchPodDetail();
    refetchMilestones();
  },[podDetailRefreshKey]);

  // 设置动态 TDK
  useSEO("pods", podDetail ? {
    title: `${podDetail.title} - HappyPods`,
    description: markdownToText(podDetail.title).substring(0, 160),
    keywords: ['Pod', podDetail.title, podDetail.grantsPool.name, 'Web3', 'Blockchain Projects', ...(podDetail.tags?.split(',') || [])]
  } : undefined);

   // 我是GP owner
   const isGPOwner = useMemo(()=>{
      return userInfo && userInfo?.id === podDetail?.grantsPool.ownerId;
    },[userInfo,podDetail]);

    // 我是pod owner
    const isPodOwner = useMemo(()=>{
      return userInfo && userInfo?.id === podDetail?.applicantId;
    },[userInfo,podDetail]);

    // 存在超时milestone
    const hasTimeoutMilestone = useMemo(()=>{
      return podDetail?.milestones?.some(milestone => milestone.status === MilestoneStatus.ACTIVE && new Date(milestone.deadline) < new Date());
    },[podDetail?.milestones]);


    // 获取当前钱包的多签 owners，用于显示余额差额的弹窗
  const [isSafeWalletOwner,setIsSafeWalletOwner] = useState(false);
  useEffect(()=>{
    if(!userInfo?.walletAddress || !podDetail?.walletAddress) return;
      const checkIsSafeWalletOwner = async()=>{
      const owners = await getSafeWalletOwners(podDetail?.walletAddress);
      console.log('owners==>',owners);
      setIsSafeWalletOwner(owners.some((v:string)=>v.toLowerCase() === userInfo.walletAddress.toLowerCase()));
    }
    checkIsSafeWalletOwner();
  },[podDetail,userInfo]);

  // 计算资金缺口
  const shortage = useMemo(()=>{
    // 计算需要的资金总额（包含手续费）
    const requiredAmount = podDetail?.milestones
    .filter(milestone => [MilestoneStatus.ACTIVE, MilestoneStatus.REVIEWING].includes(milestone.status as any))
    .reduce((acc, milestone) => Decimal(acc).plus(milestone.amount).toNumber(), 0);
    
    return Decimal(requiredAmount || 0)
    .mul(FEE_CONFIG.TRANSACTION_FEE_RATE + 1)
    .minus(podDetail?.podTreasuryBalances || 0)
    .toNumber();
  },[podDetail?.milestones,podDetail?.podTreasuryBalances]);



  if (isPodLoading || isMilestonesLoading || !podDetail) {
    return <div className="container mx-auto">
      <LoadingSkeleton />
    </div>
  }

  
  return (
    
    <div className="container mx-auto fadeIn" key={podDetailRefreshKey}>

    {/* pod 交付超时 */}
    {
        (isGPOwner) && hasTimeoutMilestone && 
        <PodMilestoneTimeoutActions pod={podDetail} />
      }

      {/* 资金注入警告 */}
      {
        (isGPOwner || isSafeWalletOwner) && 
        ![PodStatus.REJECTED,PodStatus.REVIEWING].includes(podDetail.status as any) && 
        shortage > 0 &&
        <FundInjectionWarning pod={podDetail as any} shortage={Math.abs(shortage)}/>
      }

      {/* 退款警告 */}
      {
        (isGPOwner || isPodOwner || isSafeWalletOwner) && 
        ![PodStatus.REJECTED,PodStatus.REVIEWING].includes(podDetail.status as any) && 
        shortage < 0 &&
        <RefundWarning pod={podDetail as any} shortage={Math.abs(shortage)}/>
      }

      {/* GP 审核操作 */}
      {
        isGPOwner && 
        <GpReviewActions podDetail={podDetail as any}/>
      }
      
    <div className="items-start gap-6 space-y-6 md:space-y-0 md:flex">
      

      <CardBox
        titleBg={`linear-gradient(to top, white 0%, ${getColorFromString(podDetail.title , 0.3)})`}
        contentBg="white"
        title={
        <div className="flex items-center justify-between">
          <div className="flex items-center">
              <LazyImage src={podDetail.avatar || ''} alt="" className="object-contain w-10 h-10 bg-white border border-white rounded-full shadow-medium" />
              <span className="ml-2 text-xl font-bold md:text-2xl">{podDetail.title}</span>
            </div>

            <ShareButton 
              url={typeof window !== 'undefined' ? window.location.href : ''}
              title={`${podDetail.title} - ${podDetail.description}`}
              description={podDetail.description}
              size="sm"
              color="primary"
          />
       </div>
      }
      >
        
      <div className="p-4">
        <div className="space-y-8 lg:col-span-2">
          <div>
            {/* 标签 */}
            
            <div className="flex flex-wrap gap-2 mb-3">
              {
                isPodOwner && <Tag color="primary">Pod Owner</Tag>
              }
              {
                isGPOwner && <Tag color="warning">GP Owner</Tag>
              }
              {podDetail.tags?.split(',').map((tag:string, index:number) => <Tag key={index}>{tag}</Tag>)}
            </div>
            
            <MdTextPreviewModal className="text-sm md:text-base" markdown={podDetail.description} title="Pod Description">
              <ExpandableText className="text-xs md:text-base" text={markdownToText(podDetail.description)} maxLines={2} />
            </MdTextPreviewModal>

          </div>

          {/* <EdgeLine color="var(--color-background)"/> */}

          <div>
            {milestones && 
            <MilestonesSection milestones={milestones} podDetail={podDetail as any}/>}
          </div>
        </div>
      </div>
        
      </CardBox>


      <div className="space-y-6 md:w-[500px]">
          <div className="p-4 bg-white border border-gray-200 rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold">Treasury</span>
                <div className="flex items-center gap-1 text-sm">
                  (
                    <img src={`/tokens/${podDetail.currency}.svg`} alt="" className="w-4 h-4" />
                    <small>{podDetail.currency}</small>
                  )
                </div>
              </div>
              <div className="flex items-center gap-1 space-x-2">
                <QRCodeTooltip content={podDetail.walletAddress}/>
                <a href={`https://app.safe.global/home?safe=oeth:${podDetail.walletAddress}`} target="_blank" rel="noopener noreferrer">
                  <i className="text-xl ri-external-link-line hover:opacity-70"></i>
                </a>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-1 text-left">
            
              <div className="p-2 text-black rounded-md item">
                <div className="text-xl font-bold">{formatToken(podDetail.podTreasuryBalances)}</div>
                <div className="flex items-center gap-1 text-xs text-secondary">
                    <span>Locked</span>
                    <TooltipWrap  className="mt-[-6px] h-[20px]" content={
                      <div className="w-[200px]">
                        Includes platform fees {FEE_CONFIG.TRANSACTION_FEE_RATE * 100}%, which will be deducted when each Milestone is delivered
                      </div>
                    }/>
                </div>
              </div>

              <div className="p-2 text-red-500 rounded-md">
                <div className="text-xl font-bold">{formatToken(podDetail.appliedAmount)}</div>
                <div className="text-xs text-secondary">Application</div>
              </div>
              
              <div className="p-2 text-green-500 rounded-md">
                <div className="text-xl font-bold">{formatToken(podDetail.funded)}</div>
                <div className="text-xs text-secondary">Funded</div>
              </div>
            </div>
          </div>


          <div className="p-4 bg-white border border-gray-200 rounded-xl">
            <h2 className="mb-4 text-xl font-bold">Project Details</h2>
              <div className="space-y-4">

                <div className="flex items-center justify-between space-x-2">
                  <div className="mb-1 text-sm text-secondary">Status</div>
                  <StatusChip status={podDetail.status as any} />
                </div>
                
                <div className="flex items-center justify-between space-x-2">
                  <div className="mb-1 text-sm text-secondary shrink-0">Applicant</div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 text-sm">
                      {
                        podDetail.applicant.avatar ? (
                          <LazyImage src={podDetail.applicant.avatar} alt="" className="w-6 h-6 bg-white rounded-full" />
                        ) : (
                          <i className="ri-user-2-line"></i>
                        )
                      }
                      <span>{podDetail.applicant.name}</span>
                    </div>
                    {
                      (isPodOwner || isGPOwner) && <ApplicantInfoModal applicant={podDetail.applicant} />
                    }
                  </div>
                </div>

                <div className="flex items-center justify-between space-x-2">
                  <div className="mb-1 text-sm text-secondary shrink-0">Grants Pool</div>
                  <NextLink href={`/grants-pool/${podDetail.grantsPool.id}`} className="flex items-center gap-2 hover:underline">
                    <LazyImage src={podDetail.grantsPool.avatar || ''} alt="" className="w-6 h-6 rounded-full" />
                    <span className="text-sm">{podDetail.grantsPool.name}</span>
                  </NextLink>
                </div>
                
                <div className="flex items-center justify-between space-x-2">
                  <div className="mb-1 text-sm text-secondary shrink-0">RFP</div>
                  <span className="text-sm">
                    {podDetail.rfp.title}
                  </span>
                </div>

                <div className="flex items-center justify-between space-x-2">
                  <div className="mb-1 text-sm text-secondary shrink-0">Last update</div>
                  <span className="text-sm">
                    {formatRelativeTime(podDetail.updatedAt)}
                  </span>
                </div>

                {
                  podDetail.links && Object.values(podDetail.links).filter((key:string)=>key).length > 0 && (
                    <LinkDisplay links={podDetail.links as Record<string, string>} theme="light" className="!mt-6" />
                  )
                }

              </div>
            </div>

            

            {/* 历史版本组件 */}
            <PodHistorySection pod={podDetail as any} />
            
          </div>
    </div>
    </div>
  );
} 