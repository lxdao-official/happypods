import NextLink from 'next/link';
import ProgressMilestoneBar from './progress-milestone-bar';
import { Chip } from '@heroui/react';
import type { Status } from './StatusChip';
import StatusChip from './StatusChip';
interface PodsItemProps {
  pod: {
    id: number;
    name: string;
    avatar: string | null;
    tags: string[];
    description: string;
    progress: number;
    totalFunding: number;
    currency: string;
    status: Status;
    milestones: Array<{
      name: string;
      progress: number;
      amount: number;
      createdAt: string;
      deadline: string;
      status: Status;
    }>;
    lastUpdate: string;
    unlocked?: number;
  };
  onClick?: () => void;
  className?: string;
}

const PodsItem = ({ pod, onClick, className = "" }: PodsItemProps) => {
  return (
    <NextLink 
      href={`/pods/${pod.id}`}
      className={`
        text-black 
        bg-pink rounded-xl overflow-hidden 3px 3px 0px 0px var( --color-primary cursor-pointer
        ${className}
      `}
      onClick={onClick}
      style={{
        boxShadow: "3px 3px 0px 0px var( --color-primary",
        border:"1px solid black"
      }}
    >
      {/* 卡片头部 */}
      <div className="flex items-center p-4 space-x-4 bg-white border-b border-black">
        <img src={pod.avatar || ""} alt="" className="w-10 h-10 rounded-full" />
        <div className="text-xl font-bold text-gray-900">{pod.name}</div>
      </div>

      {/* 卡片内容 */}
      <div className="p-4">
        {/* 标签 */}
        <div className="flex flex-wrap gap-2 mb-3">
          {pod.tags.map((tag, index) => (
            <small 
              key={index}
              className="px-3 py-1 text-[10px] text-black border border-black rounded-full"
            >
              {tag}
            </small>
          ))}
        </div>

        {/* 描述 */}
        <p className="mb-4 text-sm leading-relaxed">
          {pod.description}
        </p>

        {/* 资金进度 */}
        <div className="mb-4">
          <div className="flex justify-between mb-2 text-sm">
            <div className="flex items-center gap-1">
              <b>{pod.unlocked ?? 0} / {pod.totalFunding} {pod.currency}</b>
              <small><i className="ri-lock-line"></i></small>
            </div>
            <small>Progress: {pod.progress}%</small>
          </div>
          
          <ProgressMilestoneBar milestones={pod.milestones}/>

        </div>

        {/* 最后更新 */}
        <div className="flex items-center justify-between">
          <i className="block text-xs text-gray-500">Last update: {pod.lastUpdate}</i>
          <StatusChip status={pod.status} />
        </div>
      </div>
    </NextLink>
  );
};

export default PodsItem;