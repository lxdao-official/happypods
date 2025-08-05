import ApplyExtensionModal from "./apply-extension-modal";
import SubmitMilestoneModal from "./submit-milestone-modal";
import MilestoneSubmissionDisplay from "./milestone-submission-display";
import ReviewMilestoneModal from "./review-milestone-modal";
import ProgressMilestoneBar from "./progress-milestone-bar";
import StatusChip from "./StatusChip";
import { formatDate } from "~/lib/utils";
import type { Milestone } from "@prisma/client";

interface MilestonesSectionProps {
  milestones: Milestone[];
}

export default function MilestonesSection({ milestones }: MilestonesSectionProps) {

  // 转换里程碑数据格式以适配 ProgressMilestoneBar 组件
  const progressMilestones = milestones.map((milestone, index) => ({
    name: milestone.title,
    amount: milestone.amount,
    createdAt: milestone.createdAt,
    deadline: milestone.deadline,
    status: milestone.status
  }));

  const handleMilestoneSubmit = (milestoneId: string | number, data: { description: string; links: Record<string, string> }) => {
    // 提交成功后刷新页面或重新获取数据
    console.log(`Milestone ${milestoneId} submitted:`, data);
    // 这里可以调用父组件的刷新函数或重新获取数据
    window.location.reload(); // 临时解决方案，实际应该通过更优雅的方式刷新
  };

  const handleMilestoneReview = (milestoneId: string | number, data: { action: 'approve' | 'reject'; comment: string }) => {
    // 审核成功后刷新页面或重新获取数据
    console.log(`Milestone ${milestoneId} reviewed:`, data);
    // 这里可以调用父组件的刷新函数或重新获取数据
    window.location.reload(); // 临时解决方案，实际应该通过更优雅的方式刷新
  };

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
                  {remainingSubmissions<3 && milestone.status!=='COMPLETED' && (
                    <span className="text-xs text-gray-500">
                      ({remainingSubmissions} submissions left)
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {/* 只有PENDING_DELIVERY状态才显示提交按钮 */}
                  {milestone.status === 'PENDING_DELIVERY' && remainingSubmissions > 0 && (
                    <div className="flex items-center gap-2">
                      <ApplyExtensionModal milestoneId={milestone.id} />
                      <SubmitMilestoneModal 
                        milestoneId={milestone.id} 
                        onSubmit={(data) => handleMilestoneSubmit(milestone.id, data)}
                      />
                    </div>
                  )}
                  {/* 审核中状态显示审核按钮 */}
                  {milestone.status === 'REVIEWING' && (
                    <ReviewMilestoneModal 
                      milestoneId={milestone.id}
                      deliveryInfo={milestone.deliveryInfo as any[]}
                      onReview={(data) => handleMilestoneReview(milestone.id, data)}
                    />
                  )}
                </div>
              </div>
              <div className="mb-2 text-xs text-gray-600">
                <span className="font-medium">Deadline:</span> {formatDate(milestone.deadline)}
              </div>
              <p className="text-sm text-gray-700">
                {milestone.description}
              </p>
              
              {/* Display multiple submissions */}
              {milestone.deliveryInfo && milestone.deliveryInfo.length > 0 && (
                <MilestoneSubmissionDisplay 
                  deliveryInfo={milestone.deliveryInfo as any[]}
                  milestoneId={milestone.id}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
} 