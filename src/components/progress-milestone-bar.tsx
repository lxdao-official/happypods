interface ProgressMilestoneBarProps {
  progress: number;
  milestones: { name: string; progress: number }[];
}

export default function ProgressMilestoneBar({ progress, milestones }: ProgressMilestoneBarProps) {
  return (
    <div>
      {/* 进度条 */}
      <div className="mb-2">
        <div className="w-full h-[10px] border border-black rounded-full">
          <div 
            className="h-full transition-all duration-300 bg-black"
            style={{ 
              width: `${progress}%`,
              background: "url(/progressbg.png) left center repeat-x",
              backgroundSize: "10px 100%",
            }}
          />
        </div>
      </div>

      {/* 里程碑标签 */}
      <div className="flex justify-between text-xs">
        {milestones.map((milestone, index) => (
          <span key={index} className="text-center progress-milestone">
            {milestone.name}
            {milestone.progress > 0 && `[${milestone.progress}U]`}
          </span>
        ))}
      </div>
    </div>
  );
} 