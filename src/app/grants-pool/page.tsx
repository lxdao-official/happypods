"use client";

import CornerFrame from "~/components/corner-frame";
import AppBtn from "~/components/app-btn";
import GrantspoolItem from "~/components/grantspool-item";
import NextLink from 'next/link';

// Mock 数据 - 多个 Grants Pool
const mockGrantsPools = [
  {
    id: 1,
    name: "LXDAO",
    description: "LXDAO is an R&D-driven DAO building an Infinite Cycle to help sustain open-source projects and public goods.",
    logo: "💚",
    socialIcons: ["ri-email-line", "ri-github-line", "ri-twitter-line", "ri-discord-line", "ri-telegram-line"],
    fundingAmounts: [
      { amount: "10,000,000", currency: "USDT" },
      { amount: "10,000,000", currency: "USDC" }
    ],
    categories: ["DAO", "Public Goods", "Open Source"],
    proposals: [
      {
        id: 1,
        title: "Governance and Collaboration OptimizationPublic",
        description: "overnance tool development (such as proposal analysis panel, automated SOP tools), research on DAO collaboration mechanisms (such as anonymous...",
      },
      {
        id: 2,
        title: "Governance and Collaboration OptimizationPublic",
        description: "overnance tool development (such as proposal analysis panel, automated SOP tools), research on DAO collaboration mechanisms (such as anonymous...",
      },
      {
        id: 3,
        title: "Governance and Collaboration OptimizationPublic",
        description: "overnance tool development (such as proposal analysis panel, automated SOP tools), research on DAO collaboration mechanisms (such as anonymous...",
      },
      {
        id: 4,
        title: "Governance and Collaboration OptimizationPublic",
        description: "overnance tool development (such as proposal analysis panel, automated SOP tools), research on DAO collaboration mechanisms (such as anonymous...",
        avatar: "G K",
      },
    ]
  },
  {
    id: 2,
    name: "Ethereum Foundation",
    description: "Supporting the Ethereum ecosystem through grants, research, and development of core infrastructure and tools.",
    logo: "🔷",
    socialIcons: ["ri-email-line", "ri-github-line", "ri-twitter-line", "ri-discord-line", "ri-telegram-line"],
    fundingAmounts: [
      { amount: "5,000,000", currency: "USDT" },
      { amount: "2,000,000", currency: "USDC" },
    ],
    categories: ["Infrastructure", "Research", "Education"],
    proposals: [
      {
        id: 5,
        title: "Layer 2 Scaling Solutions",
        description: "Development and research of Layer 2 scaling solutions to improve Ethereum's transaction throughput and reduce gas costs...",
      },
      {
        id: 6,
        title: "Zero-Knowledge Proofs",
        description: "Research and implementation of zero-knowledge proof systems for privacy and scalability improvements...",
      },
      {
        id: 7,
        title: "Developer Tools",
        description: "Creation of developer tools and SDKs to improve the developer experience on Ethereum...",
      },
      {
        id: 8,
        title: "Security Auditing",
        description: "Comprehensive security auditing services for smart contracts and DeFi protocols...",
        avatar: "S A",
      },
    ]
  },
  {
    id: 3,
    name: "Uniswap Grants",
    description: "Supporting the growth of the Uniswap ecosystem through grants for developers, researchers, and community builders.",
    logo: "🦄",
    socialIcons: ["ri-email-line", "ri-github-line", "ri-twitter-line", "ri-discord-line", "ri-telegram-line"],
    fundingAmounts: [
      { amount: "3,000,000", currency: "USDT" },
      { amount: "1,500,000", currency: "USDC" },
    ],
    categories: ["DeFi", "DEX", "Liquidity"],
    proposals: [
      {
        id: 9,
        title: "DEX Aggregation",
        description: "Development of DEX aggregation tools to provide better pricing and liquidity across multiple exchanges...",
      },
      {
        id: 10,
        title: "Liquidity Mining",
        description: "Innovative liquidity mining strategies and reward distribution mechanisms...",
      },
      {
        id: 11,
        title: "Cross-Chain Bridges",
        description: "Development of cross-chain bridge solutions to enable liquidity movement between different blockchains...",
      },
      {
        id: 12,
        title: "Analytics Dashboard",
        description: "Comprehensive analytics dashboard for tracking DEX performance and user behavior...",
        avatar: "A D",
      },
    ]
  }
];

export default function GrantsPoolPage() {
  const handleGrantsPoolClick = (grantsPoolId: number) => {
    console.log(`Clicked on grants pool: ${grantsPoolId}`);
  };

  return (
    <div className="min-h-screen p-6">
      <div className="mx-auto max-w-7xl">
        {/* 顶部横幅 */}
        <CornerFrame className="mb-20"> 
          <div className="flex flex-col items-center justify-center gap-6 py-8 text-2xl text-center">
            <div className="mb-8">A sentence to describe Pods maybe, A sentence to describe Pods maybe</div>
            <NextLink href="/grants-pool/create" className="absolute bottom-[-25px]">
              <AppBtn btnProps={{color:"success"}}>Create Grant Pool</AppBtn>
            </NextLink>
          </div>
        </CornerFrame>

        {/* Grants Pool 列表 */}
        <div className="space-y-8">
          {mockGrantsPools.map((grantsPool) => (
            <GrantspoolItem
              key={grantsPool.id}
              grantsPool={grantsPool}
              onClick={() => handleGrantsPoolClick(grantsPool.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
} 