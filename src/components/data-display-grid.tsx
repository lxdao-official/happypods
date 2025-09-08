'use client';

import { useState, useMemo, useEffect } from 'react';
import { Input, Pagination, Select, SelectItem } from '@heroui/react';
import PodsItem from './pods-item';
import { api } from '~/trpc/react';
import LoadingSkeleton from './loading-skeleton';
import EmptyReplace from '~/components/empty-replace';
import { PodStatus } from '@prisma/client';
import { STATUS_MAP } from '~/lib/config';

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


export const DataDisplayGrid = ({
  type = 'all',
  grantsPoolId,
  className = '',
  gridClassName = 'grid grid-cols-1 gap-6 mb-8 md:grid-cols-2 lg:grid-cols-3',
  itemsPerPage = 12,
  showPagination = true,
  title = 'Pods',
  searchPlaceholder = 'Search for a pod',
  theme = 'dark',
}: Readonly<DataDisplayGridProps>) => {
  // 查询参数
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
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

  // 搜索输入防抖：将即时输入同步到用于查询的 search
  useEffect(() => {
    const id = setTimeout(() => {
      setSearch(searchInput);
    }, 1000);
    return () => clearTimeout(id);
  }, [searchInput]);

  // 说明：直接内联 Input，避免定义内部子组件导致重挂载丢失焦点

  const statusOptions = useMemo(() => {
    const options = Object.values(PodStatus).map(opt => ({
      label: STATUS_MAP[opt].label,
      value: opt
    }));
    return [
      {
        label: 'All Status',
        value: ''
      },
      ...options
    ];
  }, []);


  return (
    <div className={className}>
      {/* 搜索和筛选栏 */}
      { 
        <div className="flex justify-between gap-4 my-8">
          <div className="flex items-center gap-4">
            {title && <h2 className="text-xl font-bold md:text-2xl">{title}</h2>}
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <Input
              type="text"
              placeholder={searchPlaceholder}
              value={searchInput}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchInput(e.target.value)}
              startContent={<i className="ri-search-line"></i>}
              isClearable
              variant={type === 'gp' ? 'bordered' : 'faded'}
              color='primary'
              className="w-[120px] md:w-[300px]"
              onClear={() => setSearchInput('')}
            />
            <Select
              defaultSelectedKeys={['']}
              selectedKeys={status ? new Set([status]) : new Set([''])}
              variant={type === 'gp' ? 'bordered' : 'faded'}
              color='primary'
              renderValue={() => {
                return <div className={`${type === 'gp' ? 'text-black' : 'text-white'}`}>
                  {statusOptions.find(opt => opt.value === status)?.label}
                </div>
              }}
              onSelectionChange={(keys) => {
                const s = Array.from(keys)[0] as string;
                setStatus(s);
              }}
              className="w-[120px] md:w-[150px]"
            >
              {statusOptions.map(opt => (
                <SelectItem key={opt.value}>{opt.label}</SelectItem>
              ))}
            </Select>
          </div>
        </div>
      }

      {
        isLoading ? <LoadingSkeleton theme={theme}/> : 
        pods.length === 0 ? <EmptyReplace/> : null
      }

      {/* 数据网格 */}
      <div className={gridClassName}>
        {pods.map((pod) => (
          <PodsItem
            key={pod.id}
            pod={pod}
            type={type}
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