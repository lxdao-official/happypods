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
import ExpandableText from "./expandable-text";

interface MilestonesSectionProps {
  milestones: Milestone[];
  podDetail: Pod & {grantsPool: {treasuryWallet:string},podTreasuryBalances:BigInt};
}

export default function MilestonesSection({ milestones, podDetail }: MilestonesSectionProps) {
  const { userInfo } = useStore();
  const { grantsPool:{ownerId:gpOwnerId}, applicant:{id:podOwnerId}, currency, walletAddress:safeAddress } = podDetail as any;
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
                    <span>Deadline for delivery has passed. If an extension is needed, please communicate with the GP Moderator in time, otherwise the GP may close the current Pod and return all funds!</span>
                    </div>
                  }

                  {
                     milestone.status === 'PENDING_DELIVERY' && waitPodTreasuryRecharge &&
                      <div className="flex items-center gap-1 px-1 mb-2 text-xs text-red-600 border border-red-500 rounded-md bg-red-400/10">
                        <i className="text-xl ri-error-warning-fill"></i>
                        <span>Pod treasury balance is insufficient. Please ask the GP Moderator to transfer funds before submitting the delivery!</span>
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
                      milestone={milestone as any}
                    />
                  )}
                  
                </div>
              </div>
              <div className="flex items-center gap-4 mb-4 text-xs text-gray-600">
                
                <div className="flex items-center gap-1 text-primary">
                  <img src={`/tokens/${currency}.svg`} alt={currency} className="w-4 h-4" />
                  <b>{milestone.amount.toString()} {currency}</b>
                </div>
                
                <b>Deadline: {formatDate(milestone.deadline)}</b>

              </div>

              <div className="text-sm text-gray-700">
                <ExpandableText text={milestone.description} maxLines={3} showExpandButton={true} />
              </div>
              
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