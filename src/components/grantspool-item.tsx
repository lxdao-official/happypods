import { useState } from "react";
import { Button } from "@heroui/react";
import GrantspoolRFPItem from "./grantspool-rfp-item";
import CardBox from "./card-box";
import AppBtn from "./app-btn";
import NextLink from "next/link";
import { QRCodeTooltip } from "./qr-code-tooltip";

interface GrantspoolItemProps {
  grantsPool: {
    avatar?: string | null;
    id: number;
    name: string;
    description: string;
    logo?: string;
    links?: Record<string, string>;
    socialIcons?: string[]; // 不再直接用
    fundingAmounts?: Array<{
      amount: string;
      currency: string;
    }>; // 不再直接用
    treasuryBalances?: Record<string, {available: string, used: string, locked: string}>;
    categories: string[];
    proposals: Array<{
      id: number;
      title: string;
      description: string;
      avatar?: string | null;
    }>;
  };
  className?: string;
  children?: React.ReactNode;
  type?: "list" | "detail";
}

const GrantspoolItem = ({ grantsPool, className = "", children, type = "list" }: GrantspoolItemProps) => {
  const [activeCategory, setActiveCategory] = useState(grantsPool.categories[0]);

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

  // 头像逻辑
  const avatarSrc = grantsPool.avatar || grantsPool.logo || "/logo.svg";

  return (
    <CardBox 
    className={`${className}`} 
    titleBg="#02BC59"
    title={
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-2xl">
          <img 
            src={avatarSrc} alt="avatar" 
            className="w-10 h-10 bg-white border-black rounded-full border-1" 
          />
          <b>{grantsPool.name}</b>
        </div>
        <div className="flex items-center space-x-4">
          {/* links 渲染 */}
          {grantsPool.links && Object.entries(grantsPool.links).map(([key, url]) => (
            <NextLink href={url} key={key} target="_blank" className="hover:scale-105">
              <i className={`${iconMap[key] || "ri-link"} text-2xl`}></i>
            </NextLink>
          ))}
          {
            type === "list" ?
            <NextLink href={`/grants-pool/${grantsPool.id}`}>
              <AppBtn>View More</AppBtn>
            </NextLink>:
            <NextLink href={`/grants-pool/${grantsPool.id}/edit`}>
              <AppBtn btnProps={{color:"warning"}}>Eidt</AppBtn>
            </NextLink>
          }
        </div>
      </div>
    }
    >
      {/* 主内容区域 */}
      <div className="p-4 space-y-6">
        {/* 导航标签 */}
        <div className="flex mb-6 space-x-2">
          {grantsPool.categories.map((category) => (
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
          <p className="leading-relaxed text-gray-700">{grantsPool.description}</p>
        </div>
        {/* 资金池（treasuryBalances） */}
        {grantsPool.treasuryBalances && Object.keys(grantsPool.treasuryBalances).length > 0 && (
          <div className="space-y-10">
            <div className="flex items-center space-x-3 text-xl">
              <div className="text-2xl font-bold">Grants Pool</div>
              <QRCodeTooltip content="https://www.google.com" />
              <a href="https://www.google.com" target="_blank" className="hover:opacity-70">
                <i className="ri-external-link-line"></i>
              </a>
            </div>
            <div className="grid grid-cols-3 gap-8">
              {Object.entries(grantsPool.treasuryBalances).map(([currency, amount]) => (
                <div key={currency} className="relative flex items-start gap-10 p-2 pt-10 border border-black rounded-lg">
                  <div className="absolute top-[-20px] left-[-10px] inline-flex items-center gap-2 p-2 border border-black rounded-full bg-pink">
                    <img src={`/tokens/${currency.toLowerCase()}.svg`} alt={currency} className="w-6 h-6" />
                    <b>{currency}</b>
                  </div>
                  <div className="flex flex-col"><b>{amount.available}</b><small>Fundable</small></div>
                  <div className="flex flex-col"><b>{amount.used}</b><small>Funded</small></div>
                  <div className="flex flex-col"><b>{amount.locked}</b><small>Locked</small></div>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Request-For-Proposal 部分 */}
        <div>
          <h2 className="mb-4 text-2xl font-bold">Request-For-Proposal</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {grantsPool.proposals.map((proposal) => (
              <GrantspoolRFPItem
                key={proposal.id}
                gpId={grantsPool.id}
                proposal={proposal}
                onClick={() => handleProposalClick(proposal.id)}
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