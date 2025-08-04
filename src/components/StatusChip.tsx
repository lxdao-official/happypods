import { Chip } from "@heroui/react";
import { PodStatus,MilestoneStatus } from "@prisma/client";
import { STATUS_MAP, type Status } from "~/lib/config";


const StatusChip = ({ status }: { status: Status }) => {
  return (
    <div className="flex items-center gap-1">
      <div className={`size-2 rounded-full`} style={{backgroundColor: STATUS_MAP[status].color}}></div>
      <small className={`rounded-full`} style={{color: STATUS_MAP[status].color}}>{STATUS_MAP[status].label}</small>
    </div>
  );
};

export default StatusChip;