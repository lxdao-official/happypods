"use client";

import { useParams } from "next/navigation";
import { Chip } from "@heroui/react";
import NextLink from 'next/link';
import { truncateString } from "~/lib/utils";
import { QRCodeTooltip } from "~/components/qr-code-tooltip";
import MilestonesSection from "~/components/milestones-section";
import CardBox from "~/components/card-box";
import EdgeLine from "~/components/edge-line";
import AppBtn from "~/components/app-btn";
import type { PodHistoryItem } from "~/components/pod-history-section";
import PodHistorySection from "~/components/pod-history-section";
import { api } from "~/trpc/react";
import { MilestoneStatus } from "@prisma/client";

type Status = 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED' | 'WAITLISTED' | 'SUBMITTED' | 'APPROVED' | 'REVIEWING';

export default function PodDetailPage() {
  const params = useParams();
  const podId = parseInt(params.id as string);

  // 查询 Pod 详情
  const { data: podDetail, isLoading: isPodLoading } = api.pod.getPodDetail.useQuery(
    { id: podId },
    { enabled: !!podId }
  );

  // 查询里程碑
  const { data: milestones, isLoading: isMilestonesLoading } = api.pod.getPodMilestones.useQuery(
    { podId },
    { enabled: !!podId }
  );

  // 查询历史记录
  const { data: podHistory, isLoading: isHistoryLoading } = api.pod.getPodHistory.useQuery(
    { podId },
    { enabled: !!podId }
  );

  if (isPodLoading || isMilestonesLoading || isHistoryLoading) {
    return (
      <div className="container px-4 py-8 mx-auto">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-4 border-b-2 rounded-full animate-spin border-primary"></div>
            <p>加载中...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!podDetail) {
    return (
      <div className="container px-4 py-8 mx-auto">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold text-red-500">Pod 不存在</h1>
          <NextLink href="/pods">
            <AppBtn btnProps={{ color: "primary" }}>
              返回 Pods 列表
            </AppBtn>
          </NextLink>
        </div>
      </div>
    );
  }

  const totalFunding = podDetail.milestones.reduce((acc, milestone) => acc + milestone.amount, 0);
  const funded = podDetail.milestones.filter(milestone => milestone.status === MilestoneStatus.COMPLETED).reduce((acc, milestone) => acc + milestone.amount, 0);

  // 转换数据格式以匹配现有 UI
  const pod = {
    walletAddress: podDetail.walletAddress,
    id: podDetail.id,
    name: podDetail.title,
    avatar: podDetail.avatar || "/logo.svg",
    status: podDetail.status as Status,
    rfpIndex: podDetail.rfpIndex,
    currency: podDetail.currency,
    tags: podDetail.tags?.split(',').map(tag => tag.trim()).filter(Boolean) || [],
    createdAt: podDetail.createdAt.toISOString(),
    description: podDetail.description,
    applicant: {
      name: podDetail.applicant.name || "未知用户",
      avatar: podDetail.applicant.avatar || "https://cdn.lxdao.io/bafkreic7yeypjshk3vc6rko3rnuijygyqqlawpmlgmi3ucisyj4pj6pm4q.png"
    },
    grantsPool: {
      id: podDetail.grantsPool.id,
      name: podDetail.grantsPool.name,
      avatar: podDetail.grantsPool.avatar || "https://cdn.lxdao.io/bafkreic7yeypjshk3vc6rko3rnuijygyqqlawpmlgmi3ucisyj4pj6pm4q.png"
    },
    treasury: {
      totalFunding,
      funded,
    },
    links: podDetail.links as Record<string, string> || {}
  };

  // 转换里程碑数据格式
  const formattedMilestones = milestones?.map((milestone, index) => ({
    id: milestone.id,
    title: milestone.title,
    status: milestone.status === "ACTIVE" ? "Progress" : "Waitlisted",
    deadline: milestone.deadline.toISOString().split('T')[0] || '',
    amount: milestone.amount,
    description: milestone.description,
    phase: milestone.currentPhase || `Phase ${index + 1}`,
    maxSubmissions: 3,
    submissions: [] // 暂时为空数组，因为数据库中没有 submissions 表
  })) || [];

  // 转换历史记录数据格式
  const formattedHistory: PodHistoryItem[] = podHistory?.versions?.map(item => ({
    id: item.id,
    date: item.date,
    status: item.status,
    description: item.description
  })) || [];

  const StatusMap: Record<Status, { color: string; label: string }> = {
    'IN_PROGRESS': {
      color:"success",
      label:"In Progress"
    },
    'COMPLETED': {
      color:"success",
      label:"Completed"
    },
    'REJECTED': {
      color:"danger",
      label:"Rejected"
    },
    'WAITLISTED': {
      color:"warning",
      label:"Waitlisted"
    },
    'SUBMITTED': {
      color:"primary",
      label:"Submitted"
    },
    'APPROVED': {
      color:"success",
      label:"Approved"
    },
    'REVIEWING': {
      color:"primary",
      label:"Reviewing"
    }
  }

  return (
    <div className="container px-4 py-8 mx-auto">

      <CardBox
      titleBg="var(--color-primary)"
      title={
       <div className="flex items-center justify-between">
         <div className="flex items-center">
            <img src={pod.avatar} alt="" className="w-10 h-10 rounded-full" />
            <span className="ml-2 text-2xl font-bold">{pod.name}</span>
          </div>

         <div className="flex items-center gap-2">
          {
            pod.status === 'REVIEWING' && (
              <>
                <small>The Pod creator submits changes!</small>
                <AppBtn btnProps={{size: "sm", color: "success"}}>Approved</AppBtn>
                <AppBtn btnProps={{size: "sm", color: "danger"}}>Rejected</AppBtn>
              </>
            )
          }
          <AppBtn btnProps={{size: "sm", color: "primary"}}>
            <i className="text-xl ri-share-line"></i>
          </AppBtn>
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
            <MilestonesSection milestones={formattedMilestones} />
          </div>
        </div>

        <div className="space-y-8">
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
            <div className="flex items-center space-x-8">
              <div>
                <div className="text-2xl font-bold">{pod.treasury.totalFunding}</div>
                <div className="text-sm text-secondary">Pod Grants pool</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{pod.treasury.funded}</div>
                <div className="text-sm text-secondary">Funded</div>
              </div>
            </div>
          </div>

          <EdgeLine color="var(--color-background)"/>

          <div>
            <h2 className="mb-4 text-xl font-bold">Project Details</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between space-x-2">
                  <div className="mb-1 text-sm text-secondary">Status</div>
                  <Chip color={StatusMap[pod.status].color as any} variant="bordered">{StatusMap[pod.status].label}</Chip>
                </div>
                <div className="flex items-center justify-between space-x-2">
                  <div className="mb-1 text-sm text-secondary">Applicant</div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 text-sm">
                      <i className="ri-user-2-line"></i>
                      <span>{pod.applicant.name}</span>
                    </div>
                    <span>|</span>
                    <div className="flex items-center gap-2 text-sm">
                      <i className="ri-wallet-line"></i>
                      <span>{truncateString(podDetail.applicant.walletAddress || '0x0000000000000000000000000000000000000000')}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between space-x-2">
                  <div className="mb-1 text-sm text-secondary">Grants Pool</div>
                  <div className="flex items-center gap-2">
                    <img src={pod.grantsPool.avatar} alt="" className="w-6 h-6 rounded-full" />
                    <span className="text-sm">{pod.grantsPool.name}</span>
                    <NextLink href={`/grants-pool/${pod.grantsPool.id}`} target="_blank">
                      <i className="text-sm ri-external-link-line hover:opacity-70"></i>
                    </NextLink>
                  </div>
                </div>
                <div className="flex items-center justify-between space-x-2">
                  <div className="mb-1 text-sm text-secondary">RFP</div>
                  <span className="text-sm">{pod.rfpIndex}-RPF Title...</span>
                </div>
              </div>
            </div>

            <EdgeLine color="var(--color-background)"/>

            {pod.links && (
              <div>
                <h2 className="mb-4 text-xl font-bold">Links</h2>
                <div className="flex flex-wrap gap-4">
                {Object.entries(pod.links).map(([key, value]) => (
                  <a href={value} target="_blank" rel="noopener noreferrer" key={key} className="flex items-center gap-3 text-sm">
                      <Chip
                        key={key}
                        variant="flat"
                      >
                        <div className="flex items-center gap-2 text-black hover:opacity-75">
                          <i className={`ri-${key === 'website' ? 'global' : key}-line text-lg`}></i>
                          <span className="capitalize">{key}</span>
                          <i className="text-xs ri-external-link-line"></i>
                        </div>
                      </Chip>
                    </a>  
                  ))}
                </div>
                
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