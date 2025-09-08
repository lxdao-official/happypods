import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from "@heroui/react";
import { useMemo, useState } from "react";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { delay_s, formatDate, formatToken } from "~/lib/utils";
import CornerFrame from "./corner-frame";
import Tag from "./tag";
import { LinkDisplay } from "./link-display";
import type { GrantsPool, Pod } from "@prisma/client";
import useStore from "~/store";

interface PodVersionReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  versionData: any;
  podId: number;
  pod: Pod & {
    grantsPool: GrantsPool;
  };
}

export default function PodVersionReviewModal({
  isOpen,
  onClose,
  versionData,
  podId,
  pod
}: PodVersionReviewModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {userInfo,setPodDetailRefreshKey} = useStore();
  const onReviewComplete = async()=>{
    await delay_s(2000);
    setPodDetailRefreshKey();
  }

  const approveMutation = api.pod.approveVersion.useMutation({
    onSuccess: () => {
      toast.success("Version approved!");
      onReviewComplete();
      onClose();
    }
  });

  const rejectMutation = api.pod.rejectVersion.useMutation({
    onSuccess: () => {
      toast.success("Version rejected!");
      onReviewComplete();
      onClose();
    }
  });

  const handleApprove = async () => {
    setIsSubmitting(true);
    await approveMutation.mutateAsync({
        podId,
    });
  };

  const handleReject = async () => {
    setIsSubmitting(true);
    await rejectMutation.mutateAsync({
        podId
    });
  };



  // 是否是 pod 的Gp owner
  const isPodOwner = useMemo(()=>{
    if(!userInfo) return false;
    return pod.grantsPool.ownerId === userInfo.id;
  }, [pod, userInfo]);

  if (!versionData) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="3xl" scrollBehavior="inside" isDismissable={false}>
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span>Pod Modify Review (Submit Time: {formatDate(versionData.createdAt, 'MMM DD, HH:mm')})</span>
          </div>
        </ModalHeader>
        <ModalBody>
          <div className="py-4 space-y-6">
            {/* 基本信息 */}
            <div className="p-4 rounded-lg shadow-medium">
              <h3 className="mb-4 text-lg font-medium">Basic Information</h3>
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-secondary shrink-0">Title :</label>
                  <p className="break-all">{versionData.title}</p>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-secondary shrink-0">Description :</label>
                  <p>{versionData.description}</p>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-secondary shrink-0">Links :</label>
                  <div><LinkDisplay links={versionData.links} /></div>
                </div>

                {versionData.tags && (
                <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-secondary shrink-0">Tags :</label>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {versionData.tags.split(',').map((tag: string) => (
                        <Tag key={tag} className="text-sm font-medium border-secondary text-secondary">{tag}</Tag>
                        ))}
                    </div>
                </div>
                )}
              </div>
            </div>


            {/* Milestones */}
            {versionData.milestones && versionData.milestones.length > 0 && (
              <div className="p-4 rounded-lg shadow-medium">
                <h3 className="mb-4 text-lg font-medium">Milestones</h3>
                <div className="space-y-4">
                  {versionData.milestones.map((milestone: any, index: number) => (
                    <div key={index} className="p-4 border rounded-lg border-secondary">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-2xl font-medium text-green-500">{milestone.title}</h4>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-secondary">Content:</span> {milestone.description}    
                        </div>
                        <div>
                          <span className="text-secondary">Amount:</span> {formatToken(milestone.amount)} {pod.currency}
                        </div>
                        <div>
                          <span className="text-secondary">Deadline:</span> {formatDate(milestone.deadline)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ModalBody>
        {
        isPodOwner && <ModalFooter>
          <Button 
            color="danger" 
            variant="faded" 
            onPress={handleReject}
            isLoading={isSubmitting && rejectMutation.isPending}
            isDisabled={isSubmitting}
          >
            Reject
          </Button>
          <Button 
            color="success" 
            onPress={handleApprove}
            isLoading={isSubmitting && approveMutation.isPending}
            isDisabled={isSubmitting}
          >
            Approve
          </Button>
        </ModalFooter>
        }
      </ModalContent>
    </Modal>
  );
}
