import { Chip } from "@heroui/react";
import { PodStatus,MilestoneStatus } from "@prisma/client";

export type Status = PodStatus | MilestoneStatus;

// @ts-ignore
const statusMap: Record<Status, {label: string, color: string}> = {
    [PodStatus.REVIEWING]: {label: 'Reviewing', color: '#FFA500'},
    [PodStatus.APPROVED]: {label: 'Approved', color: '#008000'},            
    [PodStatus.REJECTED]: {label: 'Rejected', color: '#FF0000'},
    [PodStatus.IN_PROGRESS]: {label: 'In Progress', color: '#FFA500'},
    [MilestoneStatus.ACTIVE]: {label: 'Active', color: '#008000'},
    [MilestoneStatus.INACTIVE]: {label: 'Inactive', color: '#FFA500'},
    [MilestoneStatus.COMPLETED]: {label: 'Completed', color: '#008000'},
    // @ts-ignore
    [MilestoneStatus.TERMINATED]: {label: 'Terminated', color: '#FF0000'},
};  

const StatusChip = ({ status }: { status: Status }) => {
  return (
    <div className="flex items-center gap-1">
      <div className={`size-2 rounded-full`} style={{backgroundColor: statusMap[status].color}}></div>
      <small className={`rounded-full`} style={{color: statusMap[status].color}}>{statusMap[status].label}</small>
    </div>
  );
};

export default StatusChip;