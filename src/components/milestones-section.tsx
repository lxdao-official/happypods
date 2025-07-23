import { Button, Chip } from "@heroui/react";
import ApplyExtensionModal from "./apply-extension-modal";
import SubmitMilestoneModal from "./submit-milestone-modal";
import MilestoneSubmissionDisplay from "./milestone-submission-display";
import ReviewMilestoneModal from "./review-milestone-modal";
import ProgressMilestoneBar from "./progress-milestone-bar";

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
  phase?: string;
  submissions?: SubmissionData[];
  maxSubmissions?: number; // 最大提交次数，默认3次
}

interface MilestonesSectionProps {
  milestones: Milestone[];
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
};

const getMilestoneStatusColor = (status: string) => {
  const colors = {
    Progress: "bg-green-500",
    Upcoming: "bg-purple-500", 
    Waitlisted: "bg-gray-400",
    Submitted: "bg-blue-500",
    Failed: "bg-red-500"
  };
  return colors[status as keyof typeof colors] || "bg-gray-400";
};

export default function MilestonesSection({ milestones }: MilestonesSectionProps) {
  // mock 进度条和里程碑数据
  const progressMock = 66;
  const milestonesMock = [
    { name: "Milestone I", progress: 20 },
    { name: "Milestone II", progress: 20 },
    { name: "Milestone III", progress: 26 },
    { name: "Milestone IV", progress: 0 },
  ];

  const handleMilestoneSubmit = (milestoneId: string | number, data: { description: string; links: Record<string, string> }) => {
    // 这里可以处理提交逻辑，比如更新状态、调用API等
    console.log(`Milestone ${milestoneId} submitted:`, data);
  };

  const handleMilestoneReview = (milestoneId: string | number, data: { action: 'approve' | 'reject'; comment: string }) => {
    // 这里可以处理审核逻辑
    console.log(`Milestone ${milestoneId} reviewed:`, data);
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
          <ProgressMilestoneBar progress={progressMock} milestones={milestonesMock} />
        </div>
      </div>

      <div className="space-y-4">
        {milestones.map((milestone, index) => {
          const remainingSubmissions = getRemainingSubmissions(milestone);
          const isFailed = milestone.status === 'Failed' || (!canSubmit(milestone) && milestone.status !== 'Approved');
          
          return (
            <div key={milestone.id} className="p-4 border border-black rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${getMilestoneStatusColor(milestone.status)}`}></div>
                  <h3 className="font-semibold">{milestone.title}</h3>
                  <Chip className="text-black" size="sm" variant="bordered">{milestone.status}</Chip>
                  {(milestone.status === 'Waitlisted' || milestone.status === 'Submitted') && (
                    <span className="text-xs text-gray-500">
                      ({remainingSubmissions} submissions left)
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {milestone.status === 'Waitlisted' && canSubmit(milestone) && (
                    <div className="flex items-center gap-2">
                      <ApplyExtensionModal milestoneId={milestone.id} />
                      <SubmitMilestoneModal 
                        milestoneId={milestone.id} 
                        onSubmit={(data) => handleMilestoneSubmit(milestone.id, data)}
                      />
                    </div>
                  )}
                  {milestone.status === 'Submitted' && (
                    <ReviewMilestoneModal 
                      milestoneId={milestone.id}
                      onReview={(data) => handleMilestoneReview(milestone.id, data)}
                    />
                  )}
                  {/* {isFailed && (
                    <Chip color="danger" size="sm">
                      Failed - No more submissions
                    </Chip>
                  )} */}
                </div>
              </div>
              <div className="mb-2 text-sm text-gray-600">
                <span className="font-medium">Deadline:</span> {formatDate(milestone.deadline)} • 
                <span className="ml-2 font-medium">Submitted on:</span> {formatDate(milestone.deadline)}
              </div>
              <p className="text-sm text-gray-700">
                {milestone.description}
              </p>
              
              {/* Display multiple submissions */}
              {milestone.submissions && milestone.submissions.length > 0 && (
                <MilestoneSubmissionDisplay 
                  submissions={milestone.submissions}
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