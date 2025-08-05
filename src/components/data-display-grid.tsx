'use client';

import { useState, useMemo, useEffect } from 'react';
import { Input, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Button, Pagination, Select, SelectItem } from '@heroui/react';
import PodsItem from './pods-item';
import { api } from '~/trpc/react';
import LoadingSkeleton from './LoadingSkeleton';
import Empty from './Empty';
import { PodStatus } from '@prisma/client';

interface DataDisplayGridProps {
  type?: 'all' | 'gp' | 'my';
  grantsPoolId?: number;
  className?: string;
  gridClassName?: string;
  itemsPerPage?: number;
  showPagination?: boolean;
  sortClassName?: string;
  title?: string;
  searchPlaceholder?: string;
  theme?: 'light' | 'dark';
}

const STATUS_OPTIONS: ({key: PodStatus, label: string} | {key:'ALL', label: string})[] = [
  { key: 'ALL', label: 'All Status' },
  { key: PodStatus.REVIEWING, label: 'Reviewing' },
  { key: PodStatus.APPROVED, label: 'Approved' },
  { key: PodStatus.REJECTED, label: 'Rejected' },
  { key: PodStatus.IN_PROGRESS, label: 'In Progress' },
  { key: PodStatus.COMPLETED, label: 'Completed' },
  { key: PodStatus.TERMINATED, label: 'Terminated' },
];

export const DataDisplayGrid = ({
  type = 'all',
  grantsPoolId,
  className = '',
  gridClassName = 'grid grid-cols-1 gap-6 mb-8 md:grid-cols-2 lg:grid-cols-3',
  itemsPerPage = 12,
  showPagination = true,
  title = '',
  searchPlaceholder = 'Search for a pod',
  theme = 'dark',
}: Readonly<DataDisplayGridProps>) => {
  // 查询参数
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageCursor, setPageCursor] = useState<number | null>(null);

  // 查询接口
  const {
    data,
    isLoading,
  } = api.pod.getList.useQuery({
    limit: itemsPerPage,
    cursor: pageCursor ?? undefined,
    search: search || undefined,
    status: status as any || undefined,
    grantsPoolId: type === 'gp' && grantsPoolId ? grantsPoolId : undefined,
    myOnly: type === 'my' ? true : undefined,
  });

  // 分页逻辑
  const pods = data?.pods || [];
  const nextCursor = data?.nextCursor;
  const totalPages = data?.totalPages || 1;

  console.log('data',data);

  // 翻页
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    if (page === 1) {
      setPageCursor(null);
    } else if (nextCursor) {
      setPageCursor(nextCursor);
    }
  };

  // 搜索/筛选变化时重置分页
  useEffect(() => {
    setCurrentPage(1);
    setPageCursor(null);
  }, [search, status, type, grantsPoolId]);

  // 搜索栏
  const SearchBar = () => (
    <Input
      type="text"
      placeholder={searchPlaceholder}
      value={search}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
      startContent={<i className="ri-search-line"></i>}
      isClearable
      className="w-[300px] rounded-full border-primary border-1 overflow-hidden"
    />
  );


  return (
    <div className={className}>
      {/* 搜索和筛选栏 */}
      { 
        <div className="flex flex-col gap-4 my-8 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            {title && <h2 className="text-2xl font-bold">{title}</h2>}
            <SearchBar />
          </div>
          <div className="flex items-center gap-4">
            <Select
              defaultSelectedKeys={['ALL']}
              selectedKeys={status ? new Set([status]) : new Set(['ALL'])}
              onSelectionChange={(keys) => {
                const s = Array.from(keys)[0] as string;
                setStatus(s);
              }}
              className="min-w-[150px] border-1 rounded-xl border-secondary overflow-hidden"
            >
              {STATUS_OPTIONS.map(opt => (
                <SelectItem key={opt.key}>{opt.label}</SelectItem>
              ))}
            </Select>
          </div>
        </div>
      }

      {
        isLoading ? <LoadingSkeleton theme={theme}/> : 
        pods.length === 0 ? <Empty/> : null
      }

      {/* 数据网格 */}
      <div className={gridClassName}>
        {pods.map((pod) => (
          <PodsItem
            key={pod.id}
            pod={pod}
            onClick={() => {}}
          />
        ))}
      </div>

      {/* 分页 */}
      {showPagination && totalPages > 1 && (
        <div className="flex justify-center py-10">
          <Pagination
            showControls
            page={currentPage}
            total={totalPages}
            onChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
}; 