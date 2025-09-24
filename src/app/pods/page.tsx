"use client";

import { useState } from "react";
import CornerFrame from "~/components/corner-frame";
import { DataDisplayGrid } from "~/components/data-display-grid";
import { useSEO } from "~/hooks/useSeo";

export default function PodsPage() {
  useSEO("pods");

  return (
    <>
      <div className="container">

        {/* breadcrumb */}
        <CornerFrame style="border"> 
          <div className="flex flex-col items-center justify-center gap-6 text-2xl text-center md:py-8">
            <div className="text-xl md:text-2xl">Discover innovative projects and milestone-based funding opportunities</div>
            {/* <NextLink href="/pods/create">
              <AppBtn className="absolute bottom-[-25px] left-50% translate-x-[-50%]">Apply For a Pod</AppBtn>
            </NextLink> */}
          </div>
        </CornerFrame>

        {/* 数据展示网格 */}
        <DataDisplayGrid className="mt-20"/>
      </div>
    </>
  );
} 