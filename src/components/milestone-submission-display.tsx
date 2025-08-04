import { useState } from "react";
import { LinkDisplay } from "./link-display";
import { formatDate } from "~/lib/utils";

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
  milestoneId: string | number;
}

export default function MilestoneSubmissionDisplay({ deliveryInfo }: MilestoneSubmissionDisplayProps) {
  const [expandedSubmissions, setExpandedSubmissions] = useState<Set<number>>(new Set([0])); // 默认展开最新的(第一个)

  const toggleSubmission = (index: number) => {
    const newExpanded = new Set(expandedSubmissions);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSubmissions(newExpanded);
  };

  // 按提交时间排序，最新的在前
  const sortedSubmissions = [...deliveryInfo].sort((a, b) => 
    new Date(b.submittedAt || '').getTime() - new Date(a.submittedAt || '').getTime()
  );

  return (
    <div className="mt-4 space-y-3">
      {sortedSubmissions.map((submission, index) => {
        const isExpanded = expandedSubmissions.has(index);
        const isLatest = index === 0;
        
        return (
          <div key={index} className="p-4 bg-white border border-black rounded-lg">
            {/* Header */}
            <div
              className="flex items-center justify-between mb-2 cursor-pointer select-none group"
              onClick={() => toggleSubmission(index)}
            >
              <div className="flex items-center gap-4">
                {/* <i className="ri-file-text-line"></i> */}
                {
                  isLatest ? <i className="text-xl text-green-500 ri-file-check-line"></i> : <i className="text-xl text-gray-500 ri-file-close-line"></i>
                }
                <span className="font-medium text-gray-900">
                  Submission • {formatDate(submission.submittedAt)}
                </span>
                <small>{isLatest && <span className="ml-1 text-xs text-blue-600">(Latest)</span>}</small>
              </div>
              <i
                className={`ri-arrow-${isExpanded ? 'up' : 'down'}-s-line text-lg transition-colors group-hover:text-primary`}
              />
            </div>

            {/* Content */}
            {isExpanded && (
              <div className="space-y-4">
                {/* Description */}
                <div>
                  <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">
                    {submission.content}
                  </p>
                </div>

                {/* Links */}
                <LinkDisplay links={submission.links} type="list" theme="light" />

                {/* Review info */}
                {submission.reviewComment && (
                  <div className={`p-4 rounded-lg border ${
                    submission.approved
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      <i className={`text-lg ${
                        submission.approved
                          ? 'ri-checkbox-circle-line text-green-600'
                          : 'ri-close-circle-line text-red-600'
                      }`}></i>
                      <span className={`font-medium ${
                        submission.approved ? 'text-green-900' : 'text-red-900'
                      }`}>
                        {submission.approved ? 'Approved' : 'Rejected'}
                      </span>
                      {submission.reviewedAt && (
                        <span className="text-xs text-gray-500">
                          • {formatDate(submission.reviewedAt)}
                        </span>
                      )}
                      {/* {submission.review.reviewer && (
                        <span className="ml-2 text-xs text-gray-500">by {submission.review.reviewer}</span>
                      )} */}
                    </div>
                    <div className="text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">
                      {submission.reviewComment}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
} 