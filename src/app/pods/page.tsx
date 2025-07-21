"use client";

import { useState } from "react";
import { Button, Input, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Pagination } from "@heroui/react";
import PodsItem from "~/components/pods-item";
import AppBtn from "~/components/app-btn";
import CornerFrame from "~/components/corner-frame";

// Mock 数据
const mockPods = Array.from({ length: 6 }, (_, i) => ({
  id: i + 1,
  name: "WhatToBuild",
  avatar: i === 0 ? "K" : null, // 只有第一个有头像
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

export default function PodsPage() {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("Popularity");
  const [currentPage, setCurrentPage] = useState(1);

  // 分页配置
  const totalPages = 10;

  // 过滤数据
  const filteredPods = mockPods.filter(pod => 
    pod.name.toLowerCase().includes(search.toLowerCase()) ||
    pod.description.toLowerCase().includes(search.toLowerCase()) ||
    pod.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()))
  );

  // 处理卡片点击
  const handlePodClick = (podId: number) => {
    console.log(`Clicked on pod: ${podId}`);
    // 这里可以添加导航到详情页的逻辑
    // router.push(`/pods/${podId}`);
  };

  return (
    <div className="min-h-screen p-6">
      <div className="container">

        {/* breadcrumb */}
        <CornerFrame> 
          <div className="flex flex-col items-center justify-center gap-6 py-8 text-2xl text-center">
            <div className="mb-8">A sentence to describe Pods maybe, A sentence to describe Pods maybe</div>
            <AppBtn className="absolute bottom-[-25px]">Apply For a Pod</AppBtn>
          </div>
        </CornerFrame>

        {/* 顶部搜索和筛选栏 */}
        <div className="flex flex-col gap-4 mt-20 mb-8 sm:flex-row">
          {/* 搜索框 */}
          <div className="flex-1">
            <Input
              type="text"
              placeholder="search for a pod"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              startContent={ <i className="ri-search-line"></i>}
              isClearable
              className="w-[300px] rounded-full border-primary border-1 overflow-hidden"
            />
          </div>

          {/* 排序下拉框 */}
          <Dropdown className="bg-foreground color-black" placement="bottom-end">
            <DropdownTrigger>
              <Button 
                variant="bordered"
                endContent={
                  <i className="text-xl ri-arrow-down-s-line"></i>
                }
              >
                {sortBy}
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
              {
                ["Popularity", "Latest", "Funding"].map((item) => (
                  <DropdownItem key={item} className="text-black">
                    {item}
                  </DropdownItem>
                ))
              }
            </DropdownMenu>
          </Dropdown>
        </div>

        {/* Pod 卡片网格 */}
        <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-2 lg:grid-cols-3">
          {filteredPods.map((pod) => (
            <PodsItem
              key={pod.id}
              pod={pod}
              onClick={() => handlePodClick(pod.id)}
            />
          ))}
        </div>


       <div className="flex justify-center py-10">
       <Pagination showControls initialPage={1} total={10} />
       </div>

      </div>
    </div>
  );
} 