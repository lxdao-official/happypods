import { Tooltip } from "@heroui/react";

interface ProgressMilestoneBarProps {
  progress: number;
  milestones: {
    name: string;
    progress: number;
    amount: number;
    createdAt: string;
    deadline: string;
    status: string;
  }[];
  totalFunding: number;
  unlocked: number;
}

export default function ProgressMilestoneBar({ progress, milestones = [], totalFunding, unlocked }: ProgressMilestoneBarProps) {
  // 时间轴
  const start = milestones.length > 0 && milestones[0]?.createdAt ? new Date(milestones[0].createdAt).getTime() : 0;
  const lastMilestone = milestones.length > 0 ? milestones[milestones.length-1] : undefined;
  const end = lastMilestone && lastMilestone.deadline ? new Date(lastMilestone.deadline).getTime() : 0;
  const now = Date.now();
  // 当前时间百分比
  const percent = end > start ? Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100)) : 0;

  return (
    <div>
      {/* 进度条 */}
      <div className="mb-2">
        <div className="w-full h-[10px] border border-black rounded-full relative bg-white">
          <div 
            className="absolute top-0 left-0 h-full transition-all duration-300 bg-black"
            style={{ 
              width: `${progress}%`,
              background: "url(/progressbg.png) left center repeat-x",
              backgroundSize: "10px 100%",
              zIndex: 1,
            }}
          />
        </div>
      </div>

      {/* 里程碑标签和金额 */}
      <div className="flex justify-between text-xs">
        {milestones.map((milestone, index) => (
          <div key={index} className="flex flex-col items-center min-w-[60px]">
            <Tooltip 
            color="success"
            content={
              <div className="flex flex-col gap-1">
                <div>{milestone.name}</div>
                <div>{milestone.amount} U</div>
                <div>{milestone.status}</div>
                <div>{milestone.deadline ? new Date(milestone.deadline).toLocaleDateString() : ''}</div>
              </div>
            } placement="top" showArrow={true}>
              <span className="font-bold text-center progress-milestone">
                {`M${index+1}`}-{milestone.amount}U
              </span>
            </Tooltip>
          </div>
        ))}
      </div>
    </div>
  );
} 