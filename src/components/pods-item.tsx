import NextLink from 'next/link';
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
    milestones: Array<{
      name: string;
      progress: number;
    }>;
    lastUpdate: string;
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
        <img src="https://cdn.lxdao.io/bafkreic7yeypjshk3vc6rko3rnuijygyqqlawpmlgmi3ucisyj4pj6pm4q.png" alt="" className="w-10 h-10 rounded-full" />
        <div className="text-xl font-bold text-gray-900">{pod.name}</div>
      </div>

      {/* 卡片内容 */}
      <div className="p-4">
        {/* 标签 */}
        <div className="flex flex-wrap gap-2 mb-3">
          {pod.tags.map((tag, index) => (
            <span 
              key={index}
              className="px-3 py-1 text-xs text-black border border-black rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* 描述 */}
        <p className="mb-4 text-sm leading-relaxed">
          {pod.description}
        </p>

        {/* 资金进度 */}
        <div className="mb-4">
          <div className="flex justify-between mb-2 text-sm">
            <b>{pod.progress} / {pod.totalFunding} {pod.currency} unlocked</b>
            <small>Progress: {pod.progress}%</small>
          </div>
          
          {/* 进度条 */}
          <div className="mb-2">
            <div className="w-full h-[10px] border border-black rounded-full">
              <div 
                className="h-full transition-all duration-300 bg-black"
                style={{ 
                  width: `${pod.progress}%`,
                  background: "url(/progressbg.png) left center repeat-x",
                  backgroundSize: "10px 100%",
                 }}
              />
            </div>
          </div>

          {/* 里程碑标签 */}
          <div className="flex justify-between text-xs">
            {pod.milestones.map((milestone, index) => (
              <span key={index} className="text-center progress-milestone">
                {milestone.name}
                {milestone.progress > 0 && `[${milestone.progress}U]`}
              </span>
            ))}
          </div>
        </div>

        {/* 最后更新 */}
        <i className="block text-xs text-gray-500">
          Last update: {pod.lastUpdate}
        </i>
      </div>
    </NextLink>
  );
};

export default PodsItem;