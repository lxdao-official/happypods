import EdgeLine from "./edge-line";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PodStatus, type GrantsPool, type Pod } from "@prisma/client";
import EmptyReplace from "~/components/empty-replace";
import { useMemo, useState } from "react";
import useStore from "~/store";
import { formatDate } from "~/lib/utils";
import StatusChip from "./status-chip";
import PodVersionReviewModal from "./pod-version-review-modal";

interface PodHistorySectionProps {
  pod: Pod & { grantsPool: GrantsPool};
}

export default function PodHistorySection({ pod }: PodHistorySectionProps) {
  const { userInfo } = useStore();
  const params = useParams();
  const podId = parseInt(params.id as string);
  const [selectedVersion, setSelectedVersion] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 是 podower
  const isPodOwner = useMemo(()=>{
    if(!userInfo) return false;
    return pod.applicantId === userInfo.id;
  },[pod.applicantId, userInfo]);


  const canEdit = useMemo(()=>{
    return pod.versions && pod.status === PodStatus.IN_PROGRESS && 
    isPodOwner && 
    !pod.versions.some((item: any) => item?.status === 'REVIEWING'); 
  },[pod.status, isPodOwner,pod.versions]);


  const handleVersionClick = (version: any) => {
    setSelectedVersion(version);
    setIsModalOpen(true);
  };
  

  if(!pod.versions) return null;

  return (
    <div className="p-4 mt-8 bg-white border border-gray-200 rounded-xl">

    {/* <EdgeLine color="var(--color-background)" className="mb-4"/> */}
    
      <div className="flex items-center justify-between mb-4">
        <div className="text-xl font-bold">Modify</div>
        {
          canEdit && (
          <Link href={`/pods/edit/${pod.id}`} className="flex items-center gap-2 cursor-pointer hover:opacity-70">
            <i className="ri-edit-line"></i>
            <small>Edit Pod</small>
          </Link>
          )
        }
      </div>

      <div className="space-y-3">
        {/* 历史编辑版本 */}
        {pod.versions.map((item: any, index: number) => (
          <div 
            key={`version_${index}`} 
            className="flex items-center justify-between p-3 text-sm border border-black rounded-lg cursor-pointer hover:text-blue-500 fadeIn"
            onClick={() => handleVersionClick(item)}
          >
            <div className="flex items-center gap-1 underline">
              {formatDate(item?.createdAt, 'MMM DD, HH:mm')}
            </div>
            <StatusChip status={item?.status || 'REVIEWING'}/>
          </div>
        ))}
      </div>

      {
        pod.versions.length === 0 && <EmptyReplace imgClassName="w-auto h-[100px]" textClassName="text-xl" theme="dark"/>
      }
      
      {/* 版本审核弹窗 */}
      <PodVersionReviewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        versionData={selectedVersion}
        podId={podId}
        pod={pod}
      />
    </div>
  );
} 