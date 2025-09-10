import { useState } from "react";
import { LinkDisplay } from "./link-display";
import { formatDate } from "~/lib/utils";
import { MilestoneStatus } from "@prisma/client";
import { MarkdownRenderer } from "~/components/Tiptap";
import { Modal, ModalContent, ModalHeader, ModalBody, Button } from "@heroui/react";

interface SubmissionData {
  content: string;
  links: Record<string, string>;
  submittedAt: string;
  review?: {
    action: 'approve' | 'reject';
    comment: string;
    reviewedAt?: string;
    reviewer?: string;
  };
  reviewComment?:string;
  approved:boolean;
  reviewedAt?:string;
}

interface MilestoneSubmissionDisplayProps {
  deliveryInfo: SubmissionData[];
  status: MilestoneStatus;
}

export default function MilestoneSubmissionDisplay({ deliveryInfo, status }: MilestoneSubmissionDisplayProps) {
  const [selectedSubmissionIndex, setSelectedSubmissionIndex] = useState<number | null>(null);

  const openSubmissionModal = (index: number) => {
    setSelectedSubmissionIndex(index);
  };

  const closeSubmissionModal = () => {
    setSelectedSubmissionIndex(null);
  };

  // 按提交时间排序，最新的在前
  const sortedSubmissions = [...deliveryInfo].sort((a, b) => 
    new Date(b.submittedAt || '').getTime() - new Date(a.submittedAt || '').getTime()
  );

  const selectedSubmission = selectedSubmissionIndex !== null ? sortedSubmissions[selectedSubmissionIndex] : null;
  const isLatestSelected = selectedSubmissionIndex === 0 && status === MilestoneStatus.REVIEWING;

  return (
    <>
      <div className="mt-4 space-y-3">
        {sortedSubmissions.map((submission, index) => {
          const isLatest = index === 0 && status === MilestoneStatus.REVIEWING;

          return (
            <div key={index} className="p-4 border border-gray-200 rounded-lg cursor-pointer hover:shadow-medium hover:border-black group" onClick={() => openSubmissionModal(index)}>
              {/* Header */}
              <div
                className="flex items-center justify-between select-none"
              >
                <div className="flex items-center gap-4">
                  {
                    submission.approved ?
                    <i className="text-xl text-green-500 ri-file-check-line"></i> :
                    submission.reviewComment ?
                    <i className="text-xl text-red-600 ri-file-close-line"></i> :
                    <i className="text-xl text-purple-500 ri-file-history-line"></i>
                  }
                  <b className="text-xs font-medium text-gray-900 md:text-sm">
                    Submission • {formatDate(submission.submittedAt)}
                  </b>
                  <small>{isLatest && <span className="ml-1 text-xs text-blue-600">(Latest)</span>}</small>
                </div>
                <i className="text-lg transition-colors text-secondary ri-eye-line group-hover:text-primary" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal for submission details */}
      <Modal
        isOpen={selectedSubmissionIndex !== null}
        onClose={closeSubmissionModal}
        size="4xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {selectedSubmission && (
                <>
                  {
                    selectedSubmission.approved ?
                    <i className="text-xl text-green-500 ri-file-check-line"></i> :
                    selectedSubmission.reviewComment ?
                    <i className="text-xl text-red-600 ri-file-close-line"></i> :
                    <i className="text-xl text-purple-500 ri-file-history-line"></i>
                  }
                  <span>Submission Details</span>
                  {isLatestSelected && <span className="text-xs text-blue-600">(Latest)</span>}
                </>
              )}
            </div>
          </ModalHeader>
          <ModalBody className="py-6 space-y-4">
            {selectedSubmission && (
              <>
                {/* Links */}
                {Object.keys(selectedSubmission.links).length > 0 && (
                  <LinkDisplay links={selectedSubmission.links} theme="light" />
                )}

                {/* Review info */}
                {selectedSubmission.reviewComment && (
                  <div className="space-y-2">
                    <div className={`p-4 rounded-lg border ${
                      selectedSubmission.approved
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        <i className={`text-lg ${
                          selectedSubmission.approved
                            ? 'ri-checkbox-circle-line text-green-600'
                            : 'ri-close-circle-line text-red-600'
                        }`}></i>
                        <span className={`font-medium ${
                          selectedSubmission.approved ? 'text-green-900' : 'text-red-900'
                        }`}>
                          {selectedSubmission.approved ? 'Approved' : 'Rejected'}
                        </span>
                        {selectedSubmission.reviewedAt && (
                          <span className="text-xs text-gray-500">
                            • {formatDate(selectedSubmission.reviewedAt)}
                          </span>
                        )}
                      </div>
                      <div className="text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">
                        {selectedSubmission.reviewComment}
                      </div>
                    </div>
                  </div>
                )}

                {/* Description */}
                <div className="py-4 border-t-2 border-gray-200">
                  <MarkdownRenderer content={selectedSubmission.content}/>
                </div>
              </>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
} 