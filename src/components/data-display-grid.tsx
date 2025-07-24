'use client';

import { useState, useMemo } from 'react';
import { Input, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Button, Pagination } from '@heroui/react';
import PodsItem from './pods-item';

interface Pod {
  id: number;
  name: string;
  avatar: string | null;
  tags: string[];
  description: string;
  progress: number;
  totalFunding: number;
  currency: string;
  milestones: Array<{
    name: string;
    progress: number;
  }>;
  lastUpdate: string;
}

interface DataDisplayGridProps {
  onItemClick?: (pod: Pod) => void;
  searchPlaceholder?: string;
  sortOptions?: string[];
  className?: string;
  gridClassName?: string;
  itemsPerPage?: number;
  showPagination?: boolean;
  sortClassName?: string;
  title?: string;
  type?: "list" | "detail";
}

export const DataDisplayGrid = ({
  onItemClick,
  searchPlaceholder = "search for a pod",
  sortOptions = ["Popularity", "Latest", "Funding"],
  className = "",
  gridClassName = "grid grid-cols-1 gap-6 mb-8 md:grid-cols-2 lg:grid-cols-3",
  itemsPerPage = 6,
  showPagination = true,
  sortClassName = "",
  title = "",
  type = "list",
}: Readonly<DataDisplayGridProps>) => {
  // 内部状态管理
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("Popularity");
  const [currentPage, setCurrentPage] = useState(1);

  // Mock 数据
  const mockPods = Array.from({ length: 6 }, (_, i) => ({
    id: i + 1,
    name: "WhatToBuild",
    avatar: i === 0 ? "K" : null,
    tags: ["LXDAO Grants", "DAO Tool Infrastructure"],
    description: "Analyze, research, and organize application ideas to inspire everyone's creativity and avoid reinventing basic wheels.",
    progress: 60,
    totalFunding: 100,
    currency: "USDT",
    milestones: [
      { name: "Start", progress: 0 },
      { name: "M1", progress: 20 },
      { name: "M2", progress: 40 },
      { name: "M3", progress: 60 },
      { name: "M4", progress: 80 },
    ],
    lastUpdate: "Mar 12, 2025"
  }));

  // 过滤和排序逻辑
  const filteredPods = useMemo(() => {
    let filtered = mockPods.filter(pod => 
      pod.name.toLowerCase().includes(search.toLowerCase()) ||
      pod.description.toLowerCase().includes(search.toLowerCase()) ||
      pod.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()))
    );

    // 排序逻辑
    switch (sortBy) {
      case "Latest":
        filtered = filtered.sort((a, b) => new Date(b.lastUpdate).getTime() - new Date(a.lastUpdate).getTime());
        break;
      case "Funding":
        filtered = filtered.sort((a, b) => b.totalFunding - a.totalFunding);
        break;
      case "Popularity":
      default:
        filtered = filtered.sort((a, b) => b.progress - a.progress);
        break;
    }

    return filtered;
  }, [search, sortBy]);

  // 分页逻辑
  const totalPages = Math.ceil(filteredPods.length / itemsPerPage);
  const paginatedPods = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredPods.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredPods, currentPage, itemsPerPage]);

  // 处理 Pod 点击
  const handlePodClick = (pod: Pod) => {
    console.log(`Clicked on pod: ${pod.id}`);
    onItemClick?.(pod);
  };

  const SearchBar = ()=>{
    const classname = type === "detail" ?  "w-[200px] rounded-xl" : "w-[300px] rounded-full border-primary border-1 overflow-hidden";
    return (
        <Input
                variant="bordered"
            type="text"
            placeholder={searchPlaceholder}
            value={search}
            variant={type === "detail" ? "bordered" : "flat"}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            startContent={<i className="ri-search-line"></i>}
            isClearable
            className={`${classname}`}
      />
    )   
  }

  return (
    <div className={className}>
      {/* 搜索和筛选栏 */}
      <div className="flex items-center justify-between my-8">

        {type === "detail" ? <h2 className="text-2xl font-bold">{title}</h2> : <SearchBar/>}

        <div className="flex items-center gap-4">
          
          {/* {title && <SearchBar/>} */}

          {/* 排序下拉框 */}
          <Dropdown className={`bg-foreground`} placement="bottom-end">
            <DropdownTrigger>
              <Button 
                variant="bordered"
                endContent={
                  <i className={`text-xl ri-arrow-down-s-line ${sortClassName}`}></i>
                }
              >
                <span className={`${sortClassName}`}>{sortBy}</span>
              </Button>
            </DropdownTrigger>
            <DropdownMenu 
              selectedKeys={[sortBy]}
              onSelectionChange={(keys) => {
                const selectedKey = Array.from(keys)[0];
                if (selectedKey) {
                  setSortBy(selectedKey as string);
                }
              }}
            >
              {sortOptions.map((item) => (
                <DropdownItem key={item} className="text-black">
                  {item}
                </DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>
        </div>
      </div>

      {/* 数据网格 */}
      <div className={gridClassName}>
        {paginatedPods.map((pod) => (
          <PodsItem
            key={pod.id}
            pod={pod}
            onClick={() => handlePodClick(pod)}
          />
        ))}
      </div>

      {/* 分页 */}
      {showPagination && (
        <div className="flex justify-center py-10">
          <Pagination 
            showControls 
            page={currentPage}
            total={totalPages}
            onChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
}; 