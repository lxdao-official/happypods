"use client";

import CornerFrame from "~/components/corner-frame";
import CardBox from "~/components/card-box";
import type { ReactNode } from "react";
import {Accordion, AccordionItem} from "@heroui/react";

// 页面内容数据
type ContentItem = Readonly<{
  title: ReactNode;
  content: ReactNode;
}>;

const contentItems: ReadonlyArray<ContentItem> = [
  {
    title: <div className="text-2xl">🤔 What is Happy Pods?</div>,
    content: (
      <p className="text-lg">
        Happy Pods is a decentralized platform designed to connect contributors with projects they are passionate about. We solve the core problems of trust and efficiency in distributed collaboration. By forming 'Pods,' teams can work together on specific goals, apply for funding from 'Grants Pools,' and manage their resources transparently. Our mission is to create a sustainable ecosystem for public goods and open-source innovation.
      </p>
    ),
  },
  {
    title: <div className="text-2xl">🚀 The Pods Flow: For Applicants & Contributors</div>,
    content: (
      <div>
        <p className="mb-4 text-lg">
          Joining a Pod is your gateway to meaningful contribution. The process is simple and straightforward:
        </p>
        <ol className="pl-6 space-y-2 text-lg list-decimal">
          <li><strong>Discover:</strong> Browse through existing Pods to find a project that aligns with your skills and interests.</li>
          <li><strong>Apply:</strong> Submit your application to join a Pod. Showcase your expertise and explain why you're a great fit.</li>
          <li><strong>Collaborate:</strong> Once accepted, you become a member of the Pod. Start collaborating with your peers, completing tasks, and achieving project milestones together.</li>
          <li><strong>Earn:</strong> Get rewarded for your contributions as the Pod secures funding and reaches its goals.</li>
        </ol>
      </div>
    ),
  },
  {
    title: <div className="text-2xl">💰 The Grants Pool Flow: For Pods & Reviewers</div>,
    content: (
      <div>
        <p className="mb-4 text-lg">
          Grants Pools are the funding sources for Pods. The approval process is designed to be transparent and community-driven:
        </p>
        <ol className="pl-6 space-y-2 text-lg list-decimal">
          <li><strong>Proposal Submission:</strong> A Pod submits a detailed funding proposal to a relevant Grants Pool, outlining their objectives, roadmap, and budget.</li>
          <li><strong>Community Review:</strong> The proposal is reviewed by the Grants Pool members or a designated committee. This process values transparency and merit.</li>
          <li><strong>Approval & Funding:</strong> If the proposal is approved, the funds are transferred to the Pod's dedicated multi-signature wallet.</li>
          <li><strong>Milestone Tracking:</strong> The Grants Pool can track the Pod's progress against their stated milestones, ensuring accountability.</li>
        </ol>
      </div>
    ),
  },
  {
    title: <div className="text-2xl">🛡️ Security First with Safe{'{'}Wallet{'}'}</div>,
    content: (
      <p className="text-lg">
        Security is paramount. All funds within the Happy Pods ecosystem, for both Pods and Grants Pools, are managed using <a href="https://safe.global/" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline hover:text-blue-700">Safe{'{'}Wallet{'}'}</a>. By leveraging Safe's battle-tested multi-signature smart contracts, we ensure that no single individual can control the funds. Every transaction requires multiple approvals from designated members, providing robust security, preventing unauthorized access, and creating a transparent, auditable trail of all financial activities.
      </p>
    ),
  },
];

// FAQ 数据：基于 AIResource/prd.md 整理
type FAQItem = Readonly<{
  question: string;
  answer: ReactNode;
}>;

const faqs: ReadonlyArray<FAQItem> = [
  {
    question: "What is HappyPods and what problems does it solve?",
    answer: (
      <div className="space-y-2">
        <p>
          HappyPods is a mini grants platform designed for small, fast, and simple funding scenarios. It addresses long approval cycles, opaque fund distribution, and high participation barriers by streamlining the end-to-end flow from application to payout.
        </p>
        <ul className="pl-6 space-y-1 list-disc">
          <li>Optimized for micro-grants and rapid MVP validation</li>
          <li>Radically simplified application-to-disbursement workflow</li>
          <li>Blockchain-native architecture with Safe{'{'}Wallet{'}'} multi-sig</li>
          <li>Transparent and auditable on-chain fund management</li>
        </ul>
      </div>
    ),
  },
  {
    question: "Who are the core roles in the system?",
    answer: (
      <div className="space-y-2">
        <p>There are three key roles with clearly defined responsibilities and permissions:</p>
        <ul className="pl-6 space-y-1 list-disc">
          <li><strong>Grants Pool Owner (GP Owner)</strong>: Creates/manages funding pools, sets RFPs, reviews applications, and manages funds.</li>
          <li><strong>Pod Applicant</strong>: Submits proposals, defines milestones/deliverables, and executes the project.</li>
          <li><strong>Platform Admin</strong>: Neutral third party for dispute resolution; holds multi-sig rights only for exceptional cases.</li>
        </ul>
      </div>
    ),
  },
  {
    question: "How does the end-to-end funding flow work?",
    answer: (
      <div className="space-y-2">
        <ol className="pl-6 space-y-1 list-decimal">
          <li><strong>Preparation</strong>: Complete profile, choose an RFP, design 1–3 milestones with clear scope, deadlines, and budgets (typically 100–500 USDT each).</li>
          <li><strong>Review & Wallet Setup</strong>: A 3-party Safe{'{'}Wallet{'}'} is created (GP Owner, Admin, Applicant) with a 2-of-3 threshold.</li>
          <li><strong>Funding</strong>: Upon approval, GP Owner deposits the total approved amount into the multi-sig.</li>
          <li><strong>Execution</strong>: Applicant delivers according to milestones and submits proofs.</li>
          <li><strong>Disbursement</strong>: After milestone approval, funds are released via multi-sig execution.</li>
        </ol>
      </div>
    ),
  },
  {
    question: "Why multi-signature (multi-sig) and what is the threshold?",
    answer: (
      <div className="space-y-2">
        <p>
          Funds are secured using Safe{'{'}Wallet{'}'} multi-sig with a 2/3 threshold among GP Owner, Admin, and Applicant. This prevents unilateral control and creates an auditable trail for every transaction.
        </p>
        <ul className="pl-6 space-y-1 list-disc">
          <li>Risk mitigation against single-point control</li>
          <li>Transparent, on-chain approvals</li>
          <li>Battle-tested smart contracts by Safe</li>
        </ul>
      </div>
    ),
  },
  {
    question: "Which networks and tokens are currently supported?",
    answer: (
      <div className="space-y-2">
        <p>
          The current version supports USDT on the Optimism network for grant disbursement. Multi-chain and additional token support are on the roadmap.
        </p>
      </div>
    ),
  },
  {
    question: "How are milestones reviewed and funds released?",
    answer: (
      <div className="space-y-2">
        <p>
          Applicants submit milestone deliverables with verifiable artifacts (links, docs, or other proofs). The GP Owner reviews for scope alignment, quality, and completeness. Upon approval, a multi-sig transaction is co-signed and executed to release the milestone payment.
        </p>
      </div>
    ),
  },
  {
    question: "What if a milestone delivery is delayed?",
    answer: (
      <div className="space-y-2">
        <p>
          Applicants may request deadline extensions with reasonable justification. The GP Owner evaluates and approves based on project context. In case of severe delays, the GP Owner may initiate project termination per policy.
        </p>
      </div>
    ),
  },
  {
    question: "What happens if a milestone fails review multiple times?",
    answer: (
      <div className="space-y-2">
        <p>
          Each milestone can be resubmitted up to three times upon rejection. If the same milestone fails more than three times, the project is automatically terminated and the remaining funds are returned to the GP Owner via multi-sig.
        </p>
      </div>
    ),
  },
  {
    question: "How are disputes handled?",
    answer: (
      <div className="space-y-2">
        <p>
          The Platform Admin acts as a neutral third party in the multi-sig. In disputes between the GP Owner and the Applicant, the Admin may intervene to facilitate resolution and ensure fair handling according to platform policy.
        </p>
      </div>
    ),
  },
  {
    question: "What are the core security guarantees?",
    answer: (
      <div className="space-y-2">
        <ul className="pl-6 space-y-1 list-disc">
          <li>Safe{'{'}Wallet{'}'} multi-sig architecture with distributed authority</li>
          <li>On-chain transparency for all financial operations</li>
          <li>Automated releases tied to milestone approvals</li>
        </ul>
      </div>
    ),
  },
  {
    question: "What is on the near-term roadmap?",
    answer: (
      <div className="space-y-2">
        <ul className="pl-6 space-y-1 list-disc">
          <li>Multi-chain and multi-token support</li>
          <li>Integration with FairSharing for collaborative reward distribution</li>
          <li>Continuous UX improvements and security hardening</li>
        </ul>
      </div>
    ),
  },
];

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen p-6">
      <div className="mx-auto max-w-7xl">
        {/* Top Banner */}
        <CornerFrame className="mb-10">
          <div className="flex flex-col items-center justify-center gap-6 py-8 text-xl text-center">
            <h1 className="text-3xl font-bold">How It Works</h1>
            <p className="text-xl md:text-2xl">
              Happy Pods streamlines collaboration and funding for open-source and public goods projects, ensuring transparency and security every step of the way.
            </p>
          </div>
        </CornerFrame>

        {/* Content Sections */}
        <div className="space-y-10">
          {contentItems.map((item, index) => (
            <CardBox key={index} title={item.title} titleBg="#dfdfdf" contentBg="#343434">
              <div className="p-4 text-white">{item.content}</div>
            </CardBox>
          ))}

          {/* FAQ Section */}
          <CardBox title={<div className="text-2xl">❓ FAQs</div>} titleBg="#dfdfdf" contentBg="#343434">
            <div className="py-4">
              <Accordion selectionMode="multiple" variant="bordered" itemClasses={{
                base:"px-4 my-1 rounded-xl",
                title: "text-base md:text-lg text-white",
                content: "text-base md:text-base pb-4 text-white",
              }}>
                {faqs.map((item, index) => (
                  <AccordionItem key={index} aria-label={item.question} title={item.question}>
                    {item.answer}
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </CardBox>
        </div>
      </div>
    </div>
  );
}