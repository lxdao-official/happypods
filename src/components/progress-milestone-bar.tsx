import { Tooltip } from "@heroui/react";
import { formatDate } from "~/lib/utils";
import { usePathname } from "next/navigation";

interface ProgressMilestoneBarProps {
  milestones: {
    name: string;
    amount: number;
    createdAt: Date;
    deadline: Date;
    status: string;
  }[]
  children?: React.ReactNode;
}

interface ProgressSegment {
  name: string;
  startTime: number;
  endTime: number;
  duration: number;
  days: number;
  milestone: {
    name: string;
    amount: number;
    createdAt: Date;
    deadline: Date;
    status: string;
  } | null;
}

export default function ProgressMilestoneBar({ milestones = [], children }: ProgressMilestoneBarProps) {
  const pathname = usePathname();
  milestones = milestones.sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
  
    // 计算时间段和进度段
  const calculateProgressSegments = () => {
    if (milestones.length === 0) return [];
    
    const segments = [];
    
    // 添加里程碑段
    for (let i = 0; i < milestones.length; i++) {
      const milestone = milestones[i]!;
      const nextMilestone = milestones[i + 1];
      
      // 第一个里程碑从项目创建时间开始
      const startTime = i === 0 
        ? new Date(milestone.createdAt).getTime()
        : new Date(milestone.deadline).getTime();
      
      // 最后一个里程碑的结束时间
      const endTime = nextMilestone 
        ? new Date(nextMilestone.deadline).getTime()
        : new Date(milestone.deadline).getTime() + (24 * 60 * 60 * 1000); // 如果没有下一个里程碑，加一天
      
      const segmentDuration = endTime - startTime;
      const days = Math.ceil(segmentDuration / (24 * 60 * 60 * 1000));
      
      segments.push({
        name: milestone.name,
        startTime,
        endTime,
        duration: segmentDuration,
        days,
        milestone
      });
    }
    
    return segments;
  };

  const segments = calculateProgressSegments();
  
  // 计算总时间跨度
  const getTotalDuration = () => {
    if (segments.length === 0) return 0;
    const firstSegment = segments[0]!;
    const lastSegment = segments[segments.length - 1]!;
    return lastSegment.endTime - firstSegment.startTime;
  };

  const totalDuration = getTotalDuration();

  // 计算每个段的宽度百分比
  const getSegmentWidth = (segment: ProgressSegment) => {
    if (totalDuration === 0) return 0;
    return (segment.duration / totalDuration) * 100;
  };

  // 十六进制颜色数组
  const colors = [
    "#874ef1", // 蓝色
    "#1cc127", // 绿色
    "#F59E0B", // 紫色
    "#166dc3", // 橙色
    "#EC4899", // 粉色
    "#EF4444", // 红色
    "#06B6D4", // 青色
    "#84CC16", // 青绿色
    "#F97316", // 橙红色
    "#A855F7", // 紫罗兰
  ];

  // 获取段的背景颜色
  const getSegmentColor = (index: number) => {
    return colors[index % colors.length];
  };

  // 是否是详情
  const isDetail = pathname.includes('/pods/');

  // 计算当前时间在进度条中的位置
  const getCurrentTimePosition = () => {
    if (segments.length === 0) return 0;
    
    const currentTime = Date.now();
    const firstSegment = segments[0]!;
    const lastSegment = segments[segments.length - 1]!;
    
    const totalStartTime = firstSegment.startTime;
    const totalEndTime = lastSegment.endTime;
    
    if (currentTime < totalStartTime) return 0;
    if (currentTime > totalEndTime) return 100;
    
    const totalDuration = totalEndTime - totalStartTime;
    const elapsed = currentTime - totalStartTime;
    
    return (elapsed / totalDuration) * 100;
  };

  const currentPosition = getCurrentTimePosition();

  return (
    <div className={`space-y-2 ${isDetail ? 'mb-6' : 'p-2 bg-white border border-black rounded-md mb-4'}`}>

      {children && children}
      
      {/* 进度条容器 */}
      <div className="relative">
        {/* 进度条 */}
        <div className={`relative flex w-full rounded-full overflow-hidden bg-gray-200 ${isDetail ? 'mb-2 h-4' : 'h-2 mb-1'}`}>
        {segments.map((segment, index) => (
          <Tooltip
            key={index}
            content={
              <div className="flex flex-col gap-1 p-2 text-left">
                <b className="font-bold">{segment.name}</b>
                <small>Duration: {segment.days} days</small>
                <small>Start: {formatDate(new Date(segment.startTime))}</small>
                <small>End: {formatDate(new Date(segment.endTime))}</small>
                {segment.milestone && (
                  <small>Amount: {segment.milestone.amount} USDT</small>
                )}
              </div>
            }
            placement="top"
            showArrow={true}
          >
            <div
              className="h-full transition-all duration-300 cursor-pointer hover:opacity-80"
              style={{ 
                width: `${getSegmentWidth(segment)}%`,
                backgroundColor: getSegmentColor(index)
              }}
            />
          </Tooltip>
        ))}
        </div>

        {/* 当前时间指示器 - 显示为有投影的圆 */}
        {isDetail && (
          <Tooltip
            content={
              <div className="flex flex-col gap-1 p-2 text-center">
                <small className="font-semibold">Current Time</small>
                <small>{formatDate(new Date())}</small>
                <small>Progress: {Math.round(currentPosition)}%</small>
              </div>
            }
            placement="top"
            showArrow={true}
          >
            <div 
              className="absolute top-0 z-10 w-4 h-4 transition-all duration-300 scale-125 bg-white border-2 rounded-full shadow-lg cursor-pointer border-primary hover:scale-150 hover:shadow-xl"
              style={{ left: `${currentPosition}%` }}
            >
              <div className="w-full h-full rounded-full bg-primary opacity-20"></div>
            </div>
          </Tooltip>
        )}

        {/* 时间标签 */}
        {segments.length > 0 && (
          <div className="flex justify-between text-xs text-gray-600">
            <span>Start: {formatDate(new Date(segments[0]!.startTime))}</span>
            <span>End: {formatDate(new Date(segments[segments.length - 1]!.endTime))}</span>
          </div>
        )}
      </div>

      {/* 图例 - 只在 pod 详情页面显示 */}
      {isDetail && (
        <div className="items-center justify-center hidden gap-4 text-xs md:flex">
          {segments.map((segment, index) => (
            <div key={index} className="flex items-center gap-1">
              <div 
                className="w-3 h-3 rounded"
                style={{ backgroundColor: getSegmentColor(index) }}
              ></div>
              <span>{segment.name} ({segment.days}d)</span>
            </div>
          ))}
        </div>
      )}

    </div>
  );
} 