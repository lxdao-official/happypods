import { Chip } from "@heroui/react";
import { PodStatus,MilestoneStatus } from "@prisma/client";
import { STATUS_MAP, type Status } from "~/lib/config";
import Tag, { type TagColor } from "./tag";


const StatusChip = ({ status }: { status: Status }) => {
  const colorMap:Record<Status,TagColor> = {
    'IN_PROGRESS': 'primary',
    'COMPLETED': 'purple',
    'REJECTED': 'red',
    'WAITLISTED': 'error',
    'SUBMITTED': 'blue',
    'APPROVED': 'green',
    'REVIEWING': 'yellow',
    'TERMINATED': "red",
    'PENDING_DELIVERY': 'warning',
    'ACTIVE': "primary",
    'INACTIVE': "gray",
    'PENDING_PAYMENT': "warning"
  }
  
  return (
    <div className="flex items-center gap-1">
      <Tag className={`rounded-full`} color={colorMap[status]}>{STATUS_MAP[status].label}</Tag>
    </div>
  );
};

export default StatusChip;