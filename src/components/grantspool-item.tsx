import { useState } from "react";
import { Button } from "@heroui/react";
import GrantspoolRFPItem from "./grantspool-rfp-item";
import CardBox from "./card-box";
import AppBtn from "./app-btn";
import NextLink from "next/link";

interface GrantspoolItemProps {
  grantsPool: {
    id: number;
    name: string;
    description: string;
    logo: string;
    socialIcons: string[];
    fundingAmounts: Array<{
      amount: string;
      currency: string;
    }>;
    categories: string[];
    proposals: Array<{
      id: number;
      title: string;
      description: string;
      avatar?: string | null;
    }>;
  };
  onClick?: () => void;
  className?: string;
}

const GrantspoolItem = ({ grantsPool, onClick, className = "" }: GrantspoolItemProps) => {
  const [activeCategory, setActiveCategory] = useState(grantsPool.categories[0]);

  const handleProposalClick = (proposalId: number) => {
    console.log(`Clicked on proposal: ${proposalId}`);
  };

  return (
    <CardBox 
    className={`${className}`} 
    titleBg="#02BC59"
    title={
      <div className="flex items-center justify-between">
        
        <div className="flex items-center gap-2 text-2xl">
          <img 
            src="https://cdn.lxdao.io/bafkreic7yeypjshk3vc6rko3rnuijygyqqlawpmlgmi3ucisyj4pj6pm4q.png" alt="" 
              className="w-10 h-10 border-black rounded-full border-1" 
          />
          <b>{grantsPool.name}</b>
        </div>

        <div className="flex items-center space-x-4">
          {grantsPool.socialIcons.map((icon, index) => (
            <NextLink href={`https://${icon}`} key={index} target="_blank" className="hover:scale-105">
              <i className={`${icon} text-2xl`}></i>
            </NextLink>
          ))}
          <AppBtn>View More</AppBtn>
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

        {/* 资金池 */}  
        <div className="space-y-10">
            <h3 className="text-2xl font-bold">Grants Pool</h3>
            <div className="grid grid-cols-3 gap-8">
              {grantsPool.fundingAmounts.map((funding, index) => (
                <div key={index} className="relative flex items-start gap-10 p-2 pt-10 border border-black rounded-lg">
                  <div className="absolute top-[-20px] left-[-10px] inline-flex items-center gap-2 p-2 border border-black rounded-full bg-pink">
                    <img src={`/tokens/${funding.currency.toLowerCase()}.svg`} alt="" className="w-6 h-6" />
                    <b>{funding.currency}</b>
                  </div>
                  <div className="flex flex-col"><b>1000</b><small>Grants pool</small></div>
                  <div className="flex flex-col"><b>1000</b><small>Funded amount</small></div>    
                  <div className="flex flex-col"><b>1000</b><small>Locked Funds</small></div>
              </div>
              ))}
            </div>
          </div>

        {/* Request-For-Proposal 部分 */}
        <div>
          <h2 className="mb-4 text-2xl font-bold">Request-For-Proposal</h2>
          
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              {grantsPool.proposals.map((proposal) => (
                <GrantspoolRFPItem
                  key={proposal.id}
                  proposal={proposal}
                  onClick={() => handleProposalClick(proposal.id)}
                />
              ))}
            </div>
        </div>
        {/*  */}
        
      </div>
    </CardBox>
  );
};

export default GrantspoolItem;