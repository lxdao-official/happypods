import { Button, Chip } from "@heroui/react";
import ApplyExtensionModal from "./apply-extension-modal";
import SubmitMilestoneModal from "./submit-milestone-modal";
import MilestoneSubmissionDisplay from "./milestone-submission-display";
import ReviewMilestoneModal from "./review-milestone-modal";
import ProgressMilestoneBar from "./progress-milestone-bar";
import StatusChip from "./StatusChip";
import { formatDate } from "~/lib/utils";

interface SubmissionData {
  description: string;
  links: Record<string, string>;
  submittedAt: string;
  review?: {
    action: 'approve' | 'reject';
    comment: string;
    reviewedAt?: string;
    reviewer?: string;
  };
}

interface Milestone {
  id: number | string;
  title: string;
  status: string;
  deadline: string;
  amount: number;
  description: string;
  createdAt: string;
  phase?: string;
  submissions?: SubmissionData[];
  maxSubmissions?: number; // 最大提交次数，默认3次
  isPendingDelivery?: boolean; // 是否为待交付状态
  deliveryInfo?: Array<{
    content: string;
    links: Record<string, string>;
    submittedAt: string;
    approved: boolean | null;
    reviewComment: string | null;
    reviewedAt: string | null;
  }>;
}

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

  const getRemainingSubmissions = (milestone: Milestone) => {
    const maxSubmissions = milestone.maxSubmissions || 3;
    const currentSubmissions = milestone.submissions?.length || 0;
    return Math.max(0, maxSubmissions - currentSubmissions);
  };

  const canSubmit = (milestone: Milestone) => {
    return getRemainingSubmissions(milestone) > 0;
  };

  return (
    <div>
      
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Milestones</h2>
        <div className="flex-1 max-w-[500px]">
          <ProgressMilestoneBar milestones={progressMilestones} />
        </div>
      </div>

      <div className="space-y-4">
        {milestones.map((milestone, index) => {
          const remainingSubmissions = Math.max(0, 3 - (milestone.deliveryInfo?.length || 0));
          
          return (
            <div key={milestone.id} className="p-4 border border-black rounded-lg">
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
                      deliveryInfo={milestone.deliveryInfo || []}
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