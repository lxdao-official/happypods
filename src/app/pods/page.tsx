"use client";

import { useState } from "react";
import AppBtn from "~/components/app-btn";
import CornerFrame from "~/components/corner-frame";
import { DataDisplayGrid } from "~/components/data-display-grid";
import NextLink from "next/link";



export default function PodsPage() {
  return (
    <div className="p-6 ">
      <div className="container">

        {/* breadcrumb */}
        <CornerFrame> 
          <div className="flex flex-col items-center justify-center gap-6 py-8 text-2xl text-center">
            <div className="mb-4">A sentence to describe Pods maybe, A sentence to describe Pods maybe</div>
            <NextLink href="/pods/create">
              <AppBtn className="absolute bottom-[-25px] left-50% translate-x-[-50%]">Apply For a Pod</AppBtn>
            </NextLink>
          </div>
        </CornerFrame>

        {/* 数据展示网格 */}
        <DataDisplayGrid className="mt-20"/>
      </div>
    </div>
  );
} 