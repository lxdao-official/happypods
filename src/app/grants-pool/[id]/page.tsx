'use client';
import GrantspoolItem from "~/components/grantspool-item";
import { DataDisplayGrid } from "~/components/data-display-grid";
import EdgeLine from "~/components/edge-line";

const mockGrantsPools = {
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
}
const page = () => {
  return (
    <div className="container">
      <GrantspoolItem grantsPool={mockGrantsPools} type="detail">
        <div className="mt-20">
          <EdgeLine color="black"/>
          <DataDisplayGrid title="Pods" sortClassName="text-black" type="detail"/>
        </div>
      </GrantspoolItem> 
    </div>
  );
};

export default page;