'use client'
import { useState, useEffect } from "react";
import GrantspoolRFPItem from "./grantspool-rfp-item";
import CardBox from "./card-box";
import AppBtn from "./app-btn";
import NextLink from "next/link";
import { ShareButton } from "./share-button";
import GrantsPoolBalance from "./grants-pool-balance";
import type { ChainType, GrantsPool, GrantsPoolTokens, Rfps } from "@prisma/client";
import useStore from "~/store";
import { GpModInfo } from "./gp-mod-info";
import ExpandableText from "./expandable-text";
import { useMobile } from "~/hooks/useMobile";


const GrantspoolItem = ({ grantsPool, className = "", children, type = "list" }: {
  grantsPool: GrantsPool & {rfps?: Rfps[]};
  className?: string;
  children?: React.ReactNode;
  type?: "list" | "detail";
}) => {

  const { userInfo } = useStore();

  const handleProposalClick = (proposalId: number) => {
    console.log(`Clicked on proposal: ${proposalId}`);
  };

  // links icon 映射
  const iconMap: Record<string, string> = {
    email: "ri-mail-line",
    github: "ri-github-line",
    twitter: "ri-twitter-line",
    discord: "ri-discord-line",
    telegram: "ri-telegram-line",
    website: "ri-global-line",
  };

  // 在组件内部处理数据转换
  const categories = grantsPool.tags ? grantsPool.tags.split(',').map(tag => tag.trim()).filter(Boolean) : ["Default"];
  const avatarSrc = grantsPool.avatar || "/logo.svg";

  const isOwner = userInfo && userInfo?.id === grantsPool.ownerId;
  const isMobile = useMobile();

  return (
    <CardBox 
    className={`${className}`} 
    titleBg="#02BC59"
    title={
      <div className="flex items-center justify-between">
        <div className="flex items-center flex-1 gap-2 overflow-hidden text-2xl text-ellipsis whitespace-nowrap">
          <img 
            src={avatarSrc} alt="avatar" 
            className="w-10 h-10 bg-white border-black rounded-full border-1" 
          />
          
          <b className="overflow-hidden text-xl md:text-2xl text-ellipsis text-nowrap">{grantsPool.name}</b>

        </div>
        <div className="flex items-center space-x-4">
          {
            !isMobile && <>
              {/* links 渲染 */}
              {grantsPool.links && Object.entries(grantsPool.links).map(([key, url]) => (
                <NextLink href={url} key={key} target="_blank" className="hover:scale-105">
                  <i className={`${iconMap[key] || "ri-link"} text-2xl`}></i>
                </NextLink>
              ))}
              <GpModInfo mod={grantsPool.modInfo}/>
              <ShareButton/>
            </>
          }
          
          {
            type === "list" ?
            <NextLink href={`/grants-pool/${grantsPool.id}`}>
              <AppBtn>View More</AppBtn>
            </NextLink>:
            isOwner && (
              <NextLink href={`/grants-pool/${grantsPool.id}/edit`}>
                <AppBtn btnProps={{color:"warning"}}>Edit</AppBtn>
              </NextLink>
            )
          }
        </div>
      </div>
    }
    >
      {/* 主内容区域 */}
      <div className="p-4 space-y-4 md:p-0">
        {/* 导航标签 */}
        <div className="flex space-x-2">
          {categories.map((category) => (
            <button
              key={category}
              className="px-3 py-1 text-xs text-black border border-black rounded-full"
            >
              {category}
            </button>
          ))}
        </div>
        {/* 描述 */}
        <div className="md:col-span-2">
        <ExpandableText text={grantsPool.description} maxLines={3} showExpandButton={type === "detail"} />
        </div>
        {/* 资金池余额 */}
        {type==='detail' && (
          grantsPool.tokens.map(token => 
          <GrantsPoolBalance 
            gpId={grantsPool.id}
            treasuryWallet={grantsPool.treasuryWallet}
            chainType={grantsPool.chainType}
            token={token}
          />)
        )}
        {/* Request-For-Proposal 部分 */}
        <div>
          <h2 className="mb-4 text-xl font-bold md:text-2xl">Request-For-Proposal</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {grantsPool.rfps?.map((rfp) => (
              <GrantspoolRFPItem
                key={rfp.id}
                gpId={grantsPool.id}
                proposal={rfp}
                onClick={() => handleProposalClick(rfp.id)}
              />
            ))}
          </div>
        </div>
      </div>
      {children}
    </CardBox>
  );
};

export default GrantspoolItem;