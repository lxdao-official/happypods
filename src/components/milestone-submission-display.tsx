import { useState } from "react";

interface SubmissionData {
  description: string;
  links: Record<string, string>;
  submittedAt?: string;
  review?: {
    action: 'approve' | 'reject';
    comment: string;
    reviewedAt?: string;
    reviewer?: string;
  };
}

interface MilestoneSubmissionDisplayProps {
  submissions: SubmissionData[];
  milestoneId: string | number;
}

export default function MilestoneSubmissionDisplay({ submissions, milestoneId }: MilestoneSubmissionDisplayProps) {
  const [expandedSubmissions, setExpandedSubmissions] = useState<Set<number>>(new Set([0])); // 默认展开最新的(第一个)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

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
  const sortedSubmissions = [...submissions].sort((a, b) => 
    new Date(b.submittedAt || '').getTime() - new Date(a.submittedAt || '').getTime()
  );

  return (
    <div className="mt-4 space-y-3">
      {sortedSubmissions.map((submission, index) => {
        const isExpanded = expandedSubmissions.has(index);
        const isLatest = index === 0;
        
        return (
          <div key={index} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
            {/* Header */}
            <div
              className="flex items-center justify-between mb-2 cursor-pointer select-none group"
              onClick={() => toggleSubmission(index)}
            >
              <div className="flex items-center gap-2">
                {/* <i className="ri-file-text-line"></i> */}
                {
                  isLatest ? <i className="text-xl text-green-500 ri-file-check-line"></i> : <i className="text-xl text-gray-500 ri-file-close-line"></i>
                }
                <span className="font-medium text-gray-900">
                  Submission {sortedSubmissions.length - index}
                  {isLatest && <span className="ml-1 text-xs text-blue-600">(Latest)</span>}
                </span>
                {submission.submittedAt && (
                  <span className="text-xs text-gray-500">
                    • {formatDate(submission.submittedAt)}
                  </span>
                )}
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
                    {submission.description}
                  </p>
                </div>

                {/* Links */}
                {Object.keys(submission.links).length > 0 && (
                  <div>
                    <h4 className="mb-2 text-sm font-medium text-gray-900">Related Links:</h4>
                    <div className="space-y-2">
                      {Object.entries(submission.links).map(([key, url]) => (
                        <div key={key} className="flex items-center gap-2">
                          <i className={`ri-${key === 'website' ? 'global' : key}-line text-gray-500`}></i>
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 break-all hover:text-blue-700"
                          >
                            {url}
                          </a>
                          <i className="text-xs text-gray-400 ri-external-link-line"></i>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Review info */}
                {submission.review && (
                  <div className={`p-4 rounded-lg border ${
                    submission.review.action === 'approve'
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      <i className={`text-lg ${
                        submission.review.action === 'approve'
                          ? 'ri-checkbox-circle-line text-green-600'
                          : 'ri-close-circle-line text-red-600'
                      }`}></i>
                      <span className={`font-medium ${
                        submission.review.action === 'approve' ? 'text-green-900' : 'text-red-900'
                      }`}>
                        {submission.review.action === 'approve' ? 'Approved' : 'Rejected'}
                      </span>
                      {submission.review.reviewedAt && (
                        <span className="text-xs text-gray-500">
                          • {formatDate(submission.review.reviewedAt)}
                        </span>
                      )}
                      {submission.review.reviewer && (
                        <span className="ml-2 text-xs text-gray-500">by {submission.review.reviewer}</span>
                      )}
                    </div>
                    <div className="text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">
                      {submission.review.comment}
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