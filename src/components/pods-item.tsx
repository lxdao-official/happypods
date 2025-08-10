import NextLink from 'next/link';
import ProgressMilestoneBar from './progress-milestone-bar';
import StatusChip from './status-chip';
import { formatDate } from '~/lib/utils';
import type { Milestone, Pod } from '@prisma/client';
import Decimal from "decimal.js"
interface PodsItemProps {
  pod: Pod & {
    milestones: Milestone[];
  };
  onClick?: () => void;
  className?: string;
}

const PodsItem = ({ pod, onClick, className = "" }: PodsItemProps) => {
  // 在组件内部进行必要的数据处理
  const tags = pod.tags ? pod.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [];
  
  // 计算总资金和已解锁资金
  const totalFunding = pod.milestones?.reduce((sum, milestone) => Decimal(sum).plus(milestone.amount).toNumber(), 0) || 0;
  const unlocked = pod.milestones?.filter(milestone => milestone.status === 'COMPLETED').reduce((sum, milestone) => Decimal(sum).plus(milestone.amount).toNumber(), 0) || 0;
  

  // 格式化最后更新时间
  const lastUpdate = formatDate(pod.updatedAt);
  
  // 转换里程碑数据以适配 ProgressMilestoneBar 组件
  const milestonesForProgress = pod.milestones?.map((milestone, index) => ({
    name: milestone.title || `M${index + 1}`,
    amount: Number(milestone.amount),
    createdAt: milestone.createdAt,
    deadline: milestone.deadline,
    status: milestone.status as string,
  })) || [];

  return (
    <NextLink 
      href={`/pods/${pod.id}`}
      className={`
        text-black bg-pink rounded-xl overflow-hidden 3px 3px 0px 0px var( --color-primary cursor-pointer fadeIn
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
        <div className="text-xl font-bold text-gray-900">{pod.title}</div>
      </div>

      {/* 卡片内容 */}
      <div className="p-4">
        {/* 标签 */}
        <div className="flex flex-wrap gap-2 mb-3">
          {tags.map((tag, index) => (
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
              <b>{unlocked} / {totalFunding} {pod.currency}</b>
              <small><i className="ri-lock-line"></i></small>
            </div>
          </div>
          
          <ProgressMilestoneBar milestones={milestonesForProgress}/>

        </div>

        {/* 最后更新 */}
        <div className="flex items-center justify-between">
          <i className="block text-xs text-gray-500">Last update: {lastUpdate}</i>
          <StatusChip status={pod.status} />
        </div>
      </div>
    </NextLink>
  );
};

export default PodsItem;