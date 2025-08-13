import { Button, Chip } from "@heroui/react";
import EdgeLine from "./edge-line";
import { api } from "~/trpc/react";
import { useParams } from "next/navigation";
import { formatDate } from "~/lib/utils";
import { PodStatus, type Pod } from "@prisma/client";
import Empty from "./empty";
import { useMemo } from "react";
import useStore from "~/store";

export interface PodHistoryItem {
  pod:Pod
}

interface PodHistorySectionProps {
  pod: Pod;
}

export default function PodHistorySection({ pod }: PodHistorySectionProps) {
  const { userInfo } = useStore();
  const params = useParams();
  const podId = parseInt(params.id as string);
  // 查询历史记录
  const { data: podHistory } = api.pod.getPodHistory.useQuery(
    { podId },
    { enabled: !!podId }
  );

  // 是 podower
  const isPodOwner = useMemo(()=>{
    if(!userInfo) return false;
    return pod.applicantId === userInfo.id;
  },[pod.applicantId, userInfo]);

  if(!podHistory) return null;


  return (
    <div className="mt-8">

    <EdgeLine color="var(--color-background)" className="mb-4"/>
    
      <div className="flex items-center justify-between mb-4">
        <div className="text-xl font-bold">History</div>
        {
          pod.status === PodStatus.IN_PROGRESS && isPodOwner && (
          <div className="flex items-center gap-2 cursor-pointer hover:opacity-70">
            <i className="ri-edit-line"></i>
            <small>Edit Pod</small>
          </div>
          )
        }
      </div>

      <Empty imgClassName="w-auto h-[100px]" textClassName="text-xl" theme="dark"/>

      {/* <div className="space-y-3">
        {history.map(item => (
          <div key={item.id} className="flex items-center justify-between p-3 border border-black rounded-lg">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-gray-900">{item.description || `Version ${item.version || item.id}`}</span>
              <span className="text-xs text-gray-500">{formatDate(item.date)}</span>
            </div>
            <Chip color={statusMap[item.status].color as any} variant="bordered" size="sm">
              {statusMap[item.status].label}
            </Chip>
          </div>
        ))}
      </div> */}
    </div>
  );
} 