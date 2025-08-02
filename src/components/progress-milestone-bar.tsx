import { Tooltip } from "@heroui/react";

interface ProgressMilestoneBarProps {
  milestones: {
    name: string;
    progress: number;
    amount: number;
    createdAt: string;
    deadline: string;
    status: string;
  }[]
}

export default function ProgressMilestoneBar({ milestones = [] }: ProgressMilestoneBarProps) {
  // 计算时间进度
  const calculateTimeProgress = () => {
    if (milestones.length === 0) return 0;
    
    const firstMilestone = milestones[0];
    const lastMilestone = milestones[milestones.length - 1];
    
    if (!firstMilestone?.createdAt || !lastMilestone?.deadline) return 0;
    
    const startTime = new Date(firstMilestone.createdAt).getTime();
    const endTime = new Date(lastMilestone.deadline).getTime();
    const currentTime = Date.now();
    
    // 计算时间进度百分比
    const totalDuration = endTime - startTime;
    if (totalDuration <= 0) return 0;
    
    const elapsed = currentTime - startTime;
    const progress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
    
    return progress;
  };

  const progress = calculateTimeProgress();

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
            color="foreground"
            content={
              <div className="flex flex-col gap-1">
                <div>{milestone.name}</div>
                <div>{milestone.amount} U</div>
                <div>{milestone.status}</div>
                <div>{milestone.deadline ? new Date(milestone.deadline).toLocaleDateString() : ''}</div>
              </div>
            } placement="top" showArrow={true}>
              <span className="font-bold text-center cursor-pointer progress-milestone">
                <small>{`M${index+1}`}-{milestone.amount}U</small>
                {
                  milestone.status === 'Completed' && <i className="text-green-500 ri-check-line"></i>
                }
              </span>
            </Tooltip>
          </div>
        ))}
      </div>
    </div>
  );
} 