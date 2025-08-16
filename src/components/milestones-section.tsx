// import ApplyExtensionModal from "./apply-extension-modal";
import SubmitMilestoneModal from "./submit-milestone-modal";
import MilestoneSubmissionDisplay from "./milestone-submission-display";
import ReviewMilestoneModal from "./review-milestone-modal";
import ProgressMilestoneBar from "./progress-milestone-bar";
import StatusChip from "./status-chip";
import { formatDate } from "~/lib/utils";
import { MilestoneStatus, type GrantsPool, type Milestone, type Pod } from "@prisma/client";
import { useEffect, useMemo } from "react";
import useStore from "~/store";

interface MilestonesSectionProps {
  milestones: Milestone[];
  gpOwnerId: number;
  podOwnerId: number;
  podCurrency: string;
  safeAddress: string;
  podDetail: Pod & {grantsPool: {treasuryWallet:string},podTreasuryBalances:BigInt};
}

export default function MilestonesSection({ milestones, gpOwnerId, podOwnerId, podCurrency, safeAddress, podDetail }: MilestonesSectionProps) {
  const { userInfo } = useStore();
  // 转换里程碑数据格式以适配 ProgressMilestoneBar 组件
  const progressMilestones = milestones.map((milestone, index) => ({
    name: milestone.title,
    amount: Number(milestone.amount),
    createdAt: milestone.createdAt,
    deadline: milestone.deadline,
    status: milestone.status
  }));

  // gp创建
  const isGpOwner = useMemo(()=>{
    return userInfo && userInfo?.id === gpOwnerId
  },[userInfo, gpOwnerId])

  // pod创建者
  const isPodOwner = useMemo(()=>{
    return userInfo && userInfo?.id === podOwnerId
  },[userInfo, podOwnerId])

  // 当前的milestone 的所需总额大于了国库金额，需要等待国库充入
  const waitPodTreasuryRecharge = useMemo(()=>{
    if(!podDetail || !milestones) return true;
    const totalAmount = milestones
    .filter(v=>[MilestoneStatus.ACTIVE, MilestoneStatus.PENDING_DELIVERY, MilestoneStatus.REVIEWING].includes(v.status as any))
    .reduce((acc, milestone) => acc + Number(milestone.amount), 0);
    console.log('totalAmount-',totalAmount,podDetail.podTreasuryBalances);
    return totalAmount > Number(podDetail.podTreasuryBalances);
  },[milestones, podDetail])


  return (
    <div>
      <div className="mb-6 text-xl font-bold">Milestones</div>

      <ProgressMilestoneBar milestones={progressMilestones} />
      
      <div className="space-y-4">
        {milestones.map((milestone, index) => {
          const remainingSubmissions = Math.max(0, 3 - (milestone.deliveryInfo.length || 0));
          
          return (
            <div key={milestone.id} className="p-4 border border-black rounded-md">

              <div className="flex flex-col">
                  { new Date(milestone.deadline) < new Date() && !milestone.deliveryInfo.length && milestone.status === MilestoneStatus.PENDING_DELIVERY &&
                  <div className="flex items-center gap-1 px-1 mb-2 text-xs text-yellow-600 border border-yellow-500 rounded-md bg-yellow-400/10">
                    <i className="text-xl ri-error-warning-fill"></i>
                    <span>Deadline 交付已超时，如需延期请及时与 GP Moderator 沟通，否则 GP 可能将关闭当前 Pod 并退回所有资金！</span>
                    </div>
                  }

                  {
                     milestone.status === 'PENDING_DELIVERY' && waitPodTreasuryRecharge &&
                      <div className="flex items-center gap-1 px-1 mb-2 text-xs text-red-600 border border-red-500 rounded-md bg-red-400/10">
                        <i className="text-xl ri-error-warning-fill"></i>
                        <span>Pod 国库余额不足，请 GP Moderator 转入后，可提交交付！</span>
                      </div>
                  }
              </div>
                  
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold">{milestone.title}</h3>
                  {
                    milestone.status !== 'ACTIVE' && <StatusChip status={milestone.status as any} />
                  }
                  {remainingSubmissions<3 && milestone.status===MilestoneStatus.PENDING_DELIVERY && (
                    <span className="text-xs text-gray-500">
                      ({remainingSubmissions} submissions left)
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {/* 只有PENDING_DELIVERY状态才显示提交按钮 */}
                  {milestone.status === 'PENDING_DELIVERY' && remainingSubmissions > 0 && isPodOwner && !waitPodTreasuryRecharge && (
                     <SubmitMilestoneModal 
                        milestoneId={milestone.id} 
                        safeTransactionHash={milestone.safeTransactionHash}
                      /> 
                  )}
                  {/* 审核中状态显示审核按钮 */}
                  {milestone.status === 'REVIEWING' && isGpOwner && (
                    <ReviewMilestoneModal 
                      podDetail={podDetail as any}
                      safeAddress={safeAddress}
                      milestoneId={milestone.id}
                      deliveryInfo={milestone.deliveryInfo as any[]}
                      safeTransactionHash={milestone.safeTransactionHash}
                    />
                  )}
                  
                </div>
              </div>
              <div className="flex items-center gap-4 mb-4 text-xs text-gray-600">
                
                <div className="flex items-center gap-1">
                  <img src={`/tokens/${podCurrency}.svg`} alt={podCurrency} className="w-4 h-4" />
                  <b>{milestone.amount.toString()} {podCurrency}</b>
                </div>
                
                <b>Deadline: {formatDate(milestone.deadline)}</b>

              </div>

              <p className="text-sm text-gray-700">
                {milestone.description}
              </p>
              
              {/* Display multiple submissions */}
              {milestone.deliveryInfo && milestone.deliveryInfo.length > 0 && (
                <MilestoneSubmissionDisplay 
                  deliveryInfo={milestone.deliveryInfo as any[]}
                  status={milestone.status}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
} 