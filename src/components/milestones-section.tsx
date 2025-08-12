// import ApplyExtensionModal from "./apply-extension-modal";
import SubmitMilestoneModal from "./submit-milestone-modal";
import MilestoneSubmissionDisplay from "./milestone-submission-display";
import ReviewMilestoneModal from "./review-milestone-modal";
import ProgressMilestoneBar from "./progress-milestone-bar";
import StatusChip from "./status-chip";
// import PayMilestoneModal from "./pay-milestone-modal";
import { formatDate } from "~/lib/utils";
import { MilestoneStatus, type GrantsPool, type Milestone, type Pod } from "@prisma/client";
import { useMemo } from "react";
import useStore from "~/store";

interface MilestonesSectionProps {
  milestones: Milestone[];
  gpOwnerId: number;
  podOwnerId: number;
  podCurrency: string;
  safeAddress: string;
  podDetail: Pod & {grantsPool: {treasuryWallet:string}};
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

  return (
    <div>
      <div className="mb-6 text-xl font-bold">Milestones</div>

      <ProgressMilestoneBar milestones={progressMilestones} />
      
      <div className="space-y-4">
        {milestones.map((milestone, index) => {
          const remainingSubmissions = Math.max(0, 3 - (milestone.deliveryInfo.length || 0));
          
          return (
            <div key={milestone.id} className="p-4 border border-black rounded-md">
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
                  {milestone.status === 'PENDING_DELIVERY' && remainingSubmissions > 0 && isPodOwner && (
                    <div className="flex items-center gap-2">
                      <SubmitMilestoneModal 
                        milestoneId={milestone.id} 
                        safeTransactionHash={milestone.safeTransactionHash}
                      />
                    </div>
                  )}
                  {/* 审核中状态显示审核按钮 */}
                  {milestone.status === 'REVIEWING' && isGpOwner && (
                    <ReviewMilestoneModal 
                      podDetail={podDetail}
                      safeAddress={safeAddress}
                      milestoneId={milestone.id}
                      deliveryInfo={milestone.deliveryInfo as any[]}
                      safeTransactionHash={milestone.safeTransactionHash}
                    />
                  )}
                  
                  {/* 当前状态是待支付，并且是pg创建者，则显示支付按钮 */}
                  {/* {milestone.status === MilestoneStatus.PENDING_PAYMENT && isGpOwner && (
                    <PayMilestoneModal  milestoneId={milestone.id}/>
                  )} */}

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