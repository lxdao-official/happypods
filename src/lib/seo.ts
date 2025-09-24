import type { Metadata } from "next";

export interface PageSEO {
  title: string;
  description: string;
  keywords: string[];
}

export const seoConfig: Record<string, PageSEO> = {
  home: {
    title: "HappyPods - Web3 Grant Management Platform",
    description: "HappyPods is a Web3 grant management platform that connects Grant Pools with project teams (Pods), providing milestone-based smart funding workflows for transparent and efficient project financing.",
    keywords: ["Web3", "Grant Management", "DAO", "Decentralized", "Blockchain", "Ethereum", "Project Funding", "Smart Contracts", "DeFi", "Milestone-based Funding"]
  },
  "grants-pool": {
    title: "Grant Pools - HappyPods",
    description: "Explore all available grant pools and find funding opportunities that match your project. Each grant pool includes detailed funding criteria and application requirements.",
    keywords: ["Grant Pools", "Project Funding", "Grant Opportunities", "DAO Funding", "Web3 Funding", "Blockchain Projects", "Funding Criteria"]
  },
  "grants-pool/create": {
    title: "Create Grant Pool - HappyPods",
    description: "Create a new grant pool to provide funding opportunities for Web3 projects. Set funding criteria, budget ranges, and application requirements.",
    keywords: ["Create Grant Pool", "Grant Management", "DAO Governance", "Project Incubation", "Web3 Investment", "Funding Setup"]
  },
  "my-grants-pool": {
    title: "My Grant Pools - HappyPods",
    description: "Manage all your created grant pools, track application status, funding progress, and milestone completion for funded projects.",
    keywords: ["Grant Pool Management", "Project Management", "Funding Tracking", "Milestone Management", "DAO Operations", "Grant Oversight"]
  },
  pods: {
    title: "Pods - HappyPods",
    description: "Discover talented Web3 Pods, view their project proposals, team backgrounds, and funding application status.",
    keywords: ["Pods", "Web3 Projects", "Blockchain Startups", "Project Proposals", "Team Collaboration", "Project Discovery", "Pod Teams"]
  },
  "pods/create": {
    title: "Create Pod - HappyPods",
    description: "Create your Pod, submit project proposals and apply for funding. Showcase your project vision and team capabilities.",
    keywords: ["Create Pod", "Project Proposal", "Apply for Funding", "Team Formation", "Web3 Entrepreneurship", "Project Application", "Pod Creation"]
  },
  "my-pods": {
    title: "My Pods - HappyPods",
    description: "Manage all your Pods, track funding application status, milestone progress, and team collaboration.",
    keywords: ["Pod Management", "Funding Status", "Milestone Tracking", "Team Collaboration", "Pod Progress", "My Pods"]
  },
  "how-it-works": {
    title: "How It Works - HappyPods",
    description: "Learn how HappyPods provides transparent and efficient funding processes for Web3 projects through smart contracts and milestone management systems.",
    keywords: ["How It Works", "Smart Contracts", "Milestone Management", "Funding Process", "Web3 Technology", "Decentralized Governance", "Platform Guide"]
  },
  profile: {
    title: "Profile - HappyPods",
    description: "Manage your profile including wallet address, project experience, and personal bio. Build your Web3 identity profile.",
    keywords: ["Profile", "User Settings", "Web3 Identity", "Wallet Management", "Personal Bio", "User Profile"]
  },
  "pods/edit": {
    title: "Edit Pod - HappyPods",
    description: "Edit your Pod project information",
    keywords: ["Edit Pod", "Pod Management", "Project Information", "Pod Details", "Web3 Projects"]
  },
  "grants-pool/edit": {
    title: "Edit Grants Pool - HappyPods",
    description: "Edit your Grants Pool project information",
    keywords: ["Edit Grants Pool", "Grants Pool Management", "Project Information", "Grants Pool Details", "Web3 Projects"]
  }
};

export function generateMetadata(pageKey: string, dynamicData?: {
  title?: string;
  description?: string;
  keywords?: string[];
}): Metadata {
  const seo: PageSEO = (seoConfig[pageKey as keyof typeof seoConfig] ?? seoConfig.home)!;

  const title = dynamicData?.title ?? seo.title;
  const description = dynamicData?.description ?? seo.description;
  const keywords = dynamicData?.keywords ?? seo.keywords;

  return {
    title,
    description,
    keywords: keywords.join(", "),
    openGraph: {
      title,
      description,
      type: "website",
      locale: "en_US",
      siteName: "HappyPods"
    },
    twitter: {
      card: "summary_large_image",
      title,
      description
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    alternates: {
      canonical: typeof window !== 'undefined' ? window.location.href : undefined,
    }
  };
}