import NextLink from 'next/link';
import ProgressMilestoneBar from './progress-milestone-bar';
import StatusChip from './status-chip';
import { formatDate, formatRelativeTime, formatToken, getColorFromString } from '~/lib/utils';
import { MilestoneStatus, type Milestone, type Pod } from '@prisma/client';
import Decimal from "decimal.js"
import ExpandableText from './expandable-text';
import Tag from './tag';
import LazyImage from './LazyImage';
interface PodsItemProps {
  pod: Pod & {
    milestones: Milestone[];
  };
  onClick?: () => void;
  className?: string;
  type?: 'all' | 'gp' | 'my';
}

const PodsItem = ({ pod, onClick, className = "", type = 'all' }: PodsItemProps) => {
  // 在组件内部进行必要的数据处理
  const tags = pod.tags ? pod.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [];
  
  // 计算总资金和已解锁资金
  const totalFunding = pod.milestones?.reduce((sum, milestone) => Decimal(sum).plus(milestone.amount).toNumber(), 0) || 0;
  const unlocked = pod.milestones?.filter(milestone => milestone.status === MilestoneStatus.COMPLETED).reduce((sum, milestone) => Decimal(sum).plus(milestone.amount).toNumber(), 0) || 0;
  
  
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
        text-black rounded-xl overflow-hidden cursor-pointer fadeIn
        transition-all duration-300
        bg-white
        hover:border-black
        shadow-medium
        hover:scale-105
        ${className}`}
      onClick={onClick}
    >
      {/* 卡片头部 */}
      <div 
      className="flex items-center p-2 space-x-4 bg-white md:p-4" 
      style={{background: `linear-gradient(to top, white 5%, ${getColorFromString(pod.title , 0.4)})`}}
      >
        <LazyImage src={pod.avatar || ""} alt="" className="object-cover w-10 h-10 rounded-full" />
        <div className="text-xl font-bold text-gray-900"><ExpandableText text={pod.title} maxLines={1} /></div>
      </div>

      {/* 卡片内容 */}
      <div className="p-4 pt-2">
       
        {/* 描述 */}
        <p className="mb-4 text-xs leading-relaxed md:text-sm h-[40px]">
          <ExpandableText text={pod.description} maxLines={2} className='text-secondary' />
        </p>

        {/* 资金进度 */}
        <ProgressMilestoneBar milestones={milestonesForProgress}>
          <div className="flex justify-between text-sm">
            <small className='text-xs'>Application: {formatToken(totalFunding)} {pod.currency}</small>
            <small className='text-xs text-green-500'>Funded: {formatToken(unlocked)} {pod.currency}</small>
          </div>
        </ProgressMilestoneBar>

         {/* 标签 */}
         <div className="flex flex-wrap gap-2 mb-2">
          <StatusChip status={pod.status} />
          {tags.map((tag, index) => (
            <Tag key={index}>{tag}</Tag>
          ))}
        </div>


        {/* 最后更新 */}
        <div className="flex items-center justify-between">
          <i className="block text-xs">Last update: {formatRelativeTime(pod.updatedAt)}</i>
        </div>
      </div>
    </NextLink>
  );
};

export default PodsItem;