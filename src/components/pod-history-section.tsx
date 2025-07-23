import { Chip } from "@heroui/react";
import EdgeLine from "./edge-line";

export interface PodHistoryItem {
  id: string | number;
  date: string;
  status: 'pending' | 'deprecated' | 'rejected' | 'current';
  description?: string;
  version?: string;
}

interface PodHistorySectionProps {
  history: PodHistoryItem[];
}

const statusMap = {
  pending: { label: 'Pending Review', color: 'warning' },
  deprecated: { label: 'Deprecated', color: 'gray' },
  rejected: { label: 'Rejected', color: 'danger' },
  current: { label: 'Current', color: 'success' },
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};

export default function PodHistorySection({ history }: PodHistorySectionProps) {
  return (
    <div className="mt-8">

    <EdgeLine color="var(--color-background)" className="mb-4"/>
    
      <div className="flex items-center justify-between mb-4">
        <div className="text-xl font-bold">History</div>
        <div className="flex items-center gap-2 cursor-pointer hover:opacity-70">
          <i className="ri-edit-line"></i>
          <small>Edit Pod</small>
        </div>
      </div>

      <div className="space-y-3">
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
      </div>
    </div>
  );
} 