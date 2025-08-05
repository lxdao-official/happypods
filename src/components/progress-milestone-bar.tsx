import { Chip, Tooltip } from "@heroui/react";
import { m } from "framer-motion";
import { formatDate } from "~/lib/utils";

interface ProgressMilestoneBarProps {
  milestones: {
    name: string;
    amount: number;
    createdAt: string;
    deadline: string;
    status: string;
  }[]
}

export default function ProgressMilestoneBar({ milestones = [] }: ProgressMilestoneBarProps) {
  milestones = milestones.sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
  // 计算时间进度
  const calculateTimeProgress = () => {
    if (milestones.length === 0) return 0;
    
    const firstMilestone = milestones[0];
    const lastMilestone = milestones[milestones.length - 1];
    
    if (!firstMilestone?.createdAt || !lastMilestone?.deadline) return 0;
    
    const startTime = new Date(firstMilestone.createdAt).getTime();
    const endTime = new Date(lastMilestone.deadline).getTime()+(3600*24*1000);
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
        <div className="w-full h-[10px] border border-black relative bg-white">
          
          {/* 进度填充 */}
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
      <div className="relative h-8 mt-2 text-xs progress-bar">
        {/* 创建时间节点（起始点） */}
        {milestones.length > 0 && milestones[0]?.createdAt && (
          <div className="absolute flex flex-col items-start min-w-[60px]" style={{ left: '0%' }}>
            <Tooltip 
              color="foreground"
              content={
                <div className="flex flex-col gap-1 p-2 text-center">
                  <small>Project Created</small>
                  <small>Created: {formatDate(milestones[0].createdAt, 'YYYY-MM-DD')}</small>
                </div>
              } 
              placement="top" 
              showArrow={true}
            >
              <span className="font-bold text-center cursor-pointer progress-milestone hover:scale-105 whitespace-nowrap">
                <small>Start</small>
              </span>
            </Tooltip>
          </div>
        )}

        {/* 里程碑节点 */}
        {milestones.map((milestone, index) => {
          // 计算每个里程碑在时间跨度中的位置百分比
          const firstMilestone = milestones[0];
          const lastMilestone = milestones[milestones.length - 1];
          
          if (!firstMilestone?.createdAt || !lastMilestone?.deadline) return null;
          
          const startTime = new Date(firstMilestone.createdAt).getTime();
          const endTime = new Date(lastMilestone.deadline).getTime();
          const milestoneTime = new Date(milestone.deadline).getTime();
          
          // 计算里程碑的位置百分比
          const totalDuration = endTime - startTime;
          const milestoneOffset = milestoneTime - startTime;
          const positionPercent = totalDuration > 0 ? Math.min(100, Math.max(0, (milestoneOffset / totalDuration) * 100)) : 0;
          
          // 判断是否为最后一个里程碑
          const isLastMilestone = index === milestones.length - 1;
          
          return (
            <div 
              key={index} 
              className={`absolute flex flex-col min-w-[60px] ${
                isLastMilestone ? 'items-end -translate-x-full' : 'items-center -translate-x-1/2'
              }`}
              style={{ left: `${positionPercent}%` }}
            >
              <Tooltip 
                color="foreground"
                content={
                  <div className="flex flex-col gap-1 p-2 text-center">
                    <small>{milestone.name}</small>
                    <small>Deadline: {formatDate(milestone.deadline, 'YYYY-MM-DD')}</small>
                  </div>
                } 
                placement="top" 
                showArrow={true}
              >
                <span className="gap-2 font-bold text-center cursor-pointer progress-milestone hover:scale-105 whitespace-nowrap">
                  {
                    milestone.status === 'COMPLETED' && <i className="mr-1 text-green-500 ri-check-line"></i>
                  }
                  <small>{`${formatDate(milestone.deadline,'MM.DD')}`}-{milestone.amount}U</small>
                </span>
              </Tooltip>
            </div>
          );
        })}
      </div>
    </div>
  );
} 