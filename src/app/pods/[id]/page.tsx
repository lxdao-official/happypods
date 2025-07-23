"use client";

import CornerFrame from "~/components/corner-frame";
import { Button, Chip } from "@heroui/react";
import NextLink from 'next/link';
import { truncateString } from "~/lib/utils";
import { QRCodeTooltip } from "~/components/qr-code-tooltip";
import MilestonesSection from "~/components/milestones-section";
import CardBox from "~/components/card-box";
import EdgeLine from "~/components/edge-line";
import AppBtn from "~/components/app-btn";
import type { PodHistoryItem } from "~/components/pod-history-section";
import PodHistorySection from "~/components/pod-history-section";

export default function PodDetailPage() {
  // mock 数据
  const pod = {
    id: 1,
    name: "WhatToBuild",
    avatar: "/logo.svg",
    status: "IN_PROGRESS",
    rfpIndex: 2,
    currency: "USDC",
    tags: ["AI", "Web3", "NFT", "DAO"],
    createdAt: new Date().toISOString(),
    shortDescription: "Analyze, research, and organize application ideas to inspire everyone's creativity and avoid reinventing basic wheels.",
    detailDescription: "Climate change is a serious problem that is affecting our planet and we are building a platform that connects people with similar interests.\n\nWe are solving this problem by building a platform that connects people with similar interests to solve the problem of climate change.\n\nWe are on a mission to build a better world by solving the problem of climate change.",
    applicant: {
      name: "Alice Chen",
      avatar: "https://cdn.lxdao.io/bafkreic7yeypjshk3vc6rko3rnuijygyqqlawpmlgmi3ucisyj4pj6pm4q.png"
    },
    grantsPool: {
      id: 1,
      name: "LXDAO Grants",
      avatar: "https://cdn.lxdao.io/bafkreic7yeypjshk3vc6rko3rnuijygyqqlawpmlgmi3ucisyj4pj6pm4q.png"
    },
    treasury: {
      totalFunding: "15,000",
      currency: "USDT",
      description: "For Grants Distribution"
    },
    links: {
      website: "https://whattobuild.app",
      github: "https://github.com/whattobuild",
      twitter: "https://twitter.com/whattobuild"
    },
    milestones: [
      {
        id: 1,
        title: "Milestone I",
        status: "Progress",
        deadline: "2024-03-20",
        amount: 3000,
        description: "Summary of milestone one.",
        phase: "Basic Setup"
      },
      {
        id: 2,
        title: "Milestone II",
        status: "Upcoming",
        deadline: "2024-04-15",
        amount: 5000,
        description: "Summary of milestone two.",
        phase: "Core Development"
      },
      {
        id: 3,
        title: "Milestone III",
        status: "Waitlisted",
        deadline: "2024-05-10",
        amount: 4000,
        description: "Summary of milestone three.",
        phase: "Testing & Launch",
        maxSubmissions: 3,
        submissions: [
          {
            description: "First submission: Initial testing completed. All basic features are working properly.",
            links: {
              website: "https://demo.whattobuild.app/v1",
              github: "https://github.com/whattobuild/milestone-3-v1",
              twitter: ""
            },
            submittedAt: "2024-05-01T10:00:00Z",
            review: {
              action: 'reject' as const,
              comment: '测试覆盖率不足，需要补充更完整的测试用例。',
              reviewedAt: '2024-05-02T15:00:00Z',
              reviewer: 'GrantPool Admin'
            }
          }
        ]
      },
      {
        id: 4,
        title: "Milestone IV",
        status: "Submitted",
        deadline: "2024-06-01",
        amount: 3000,
        description: "Summary of milestone four.",
        phase: "Maintenance",
        maxSubmissions: 3,
        submissions: [
          {
            description: "I have successfully completed the maintenance phase of the project. This includes:\n\n1. Bug fixes and performance optimizations\n2. Documentation updates\n3. User feedback implementation\n4. Testing and quality assurance\n\nThe project is now stable and ready for production use.",
            links: {
              website: "https://demo.whattobuild.app",
              github: "https://github.com/whattobuild/milestone-4",
              twitter: "https://twitter.com/whattobuild/status/123"
            },
            submittedAt: "2024-05-28T10:30:00Z",
            review: {
              action: 'approve' as const,
              comment: '交付内容完整，文档和测试齐全，项目已达标，给予通过。',
              reviewedAt: '2024-05-29T15:00:00Z',
              reviewer: 'GrantPool Admin'
            }
          },
          {
            description: "Second attempt with improved documentation and additional test cases.",
            links: {
              website: "https://demo.whattobuild.app/v2",
              github: "https://github.com/whattobuild/milestone-4-v2",
              twitter: ""
            },
            submittedAt: "2024-05-25T14:20:00Z",
            review: {
              action: 'reject' as const,
              comment: '文档仍需完善，测试用例覆盖率不够。',
              reviewedAt: '2024-05-26T10:00:00Z',
              reviewer: 'GrantPool Admin'
            }
          },
          {
            description: "Initial submission for milestone IV. Basic maintenance tasks completed.",
            links: {
              website: "https://demo.whattobuild.app/v1",
              github: "https://github.com/whattobuild/milestone-4-v1",
              twitter: ""
            },
            submittedAt: "2024-05-20T16:45:00Z",
            review: {
              action: 'reject' as const,
              comment: '提交内容不够详细，需要更多的说明和证明材料。',
              reviewedAt: '2024-05-21T09:30:00Z',
              reviewer: 'GrantPool Admin'
            }
          }
        ]
      }
    ]
  };

  const podHistory: PodHistoryItem[] = [
    {
      id: 1,
      date: "2024-03-01T10:00:00Z",
      status: "deprecated",
      description: "Initial version submitted for review."
    },
    {
      id: 2,
      date: "2024-03-10T15:30:00Z",
      status: "rejected",
      description: "Second version, rejected due to missing documentation."
    },
    {
      id: 3,
      date: "2024-04-01T09:00:00Z",
      status: "pending",
      description: "Third version, pending review."
    },
    {
      id: 4,
      date: "2024-05-01T12:00:00Z",
      status: "current",
      description: "Current version, all requirements met."
    }
  ];

  return (
    <div className="container px-4 py-8 mx-auto">

      <CardBox
      titleBg="var(--color-primary)"
      title={
       <div className="flex items-center justify-between">
         <div className="flex items-center">
            <img src="https://cdn.lxdao.io/bafkreic7yeypjshk3vc6rko3rnuijygyqqlawpmlgmi3ucisyj4pj6pm4q.png" alt="" className="w-10 h-10 rounded-full" />
            <span className="ml-2 text-2xl font-bold">{pod.name}</span>
          </div>

         <div className="flex items-center gap-2">
          <small>The Pod creator submits changes!</small>
          <AppBtn btnProps={{size: "sm", color: "success"}}>Approved</AppBtn>
          <AppBtn btnProps={{size: "sm", color: "danger"}}>Rejected</AppBtn>
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
                  {pod.shortDescription}
                </p>
              </div>
            </div>
          </div>

          <EdgeLine color="var(--color-background)"/>

          <div>
            <MilestonesSection milestones={pod.milestones} />
          </div>
        </div>

        <div className="space-y-8">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold">Treasury</span>
                <div className="flex items-center gap-1 text-sm">
                  (
                    <img src="/tokens/usdt.svg" alt="" className="w-4 h-4" />
                    <small>USDT</small>
                  )
                </div>
              </div>
              <div className="flex items-center gap-1 space-x-2">
                <QRCodeTooltip content="0xxxxxxxx"/>
                <a href="http://" target="_blank" rel="noopener noreferrer">
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
                <div className="text-2xl font-bold">{pod.treasury.totalFunding}</div>
                <div className="text-sm text-secondary">Funded</div>
              </div>
            </div>
          </div>

          <EdgeLine color="var(--color-background)"/>

          <div>
            <h2 className="mb-4 text-xl font-bold">Project Details</h2>
              <div className="space-y-4">
                <div>
                  <div className="mb-1 text-sm text-secondary">Status</div>
                  <Chip color="success" variant="bordered">In Progress</Chip>
                </div>
                <div>
                  <div className="mb-1 text-sm text-secondary">Applicant</div>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 text-sm">
                      <i className="ri-user-2-line"></i>
                      <span>{pod.applicant.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <i className="ri-wallet-line"></i>
                      <span>{truncateString('0x2222222222432234234234')}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="mb-1 text-sm text-secondary">Grants Pool</div>
                  <div className="flex items-center gap-2">
                    <img src={pod.grantsPool.avatar} alt="" className="w-6 h-6 rounded-full" />
                    <span className="text-sm">{pod.grantsPool.name}</span>
                    <NextLink href={`/grants-pool/${pod.grantsPool.id}`} target="_blank">
                      <i className="text-sm ri-external-link-line hover:opacity-70"></i>
                    </NextLink>
                  </div>
                </div>
                <div>
                  <div className="mb-1 text-sm text-secondary">RFP</div>
                  <span className="text-sm">{pod.rfpIndex}-RPF Title...</span>
                </div>
              </div>
            </div>

            <EdgeLine color="var(--color-background)"/>

            {pod.links && (
              <div>
                <h2 className="mb-4 text-xl font-bold">Links</h2>
                <div className="space-y-2">
                  {Object.entries(pod.links).map(([key, value]) => (
                    <a
                      key={key}
                      href={value}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 text-sm"
                    >
                      <i className={`ri-${key === 'website' ? 'global' : key}-line text-lg`}></i>
                      <span className="capitalize">{key}</span>
                      <i className="text-xs ri-external-link-line"></i>
                    </a>
                  ))}
                </div>
                
                {/* 历史版本组件 */}
                <PodHistorySection history={podHistory} />
              </div>
            )}
          </div>
        </div>
        
      </CardBox>

      
    </div>
  );
} 