"use client";

import CornerFrame from "~/components/corner-frame";
import CardBox from "~/components/card-box";

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen p-6">
      <div className="mx-auto max-w-7xl">
        {/* Top Banner */}
        <CornerFrame className="mb-20">
          <div className="flex flex-col items-center justify-center gap-6 py-8 text-xl text-center">
            <h1 className="text-3xl font-bold">How It Works</h1>
            <p className="max-w-3xl">
              Happy Pods streamlines collaboration and funding for open-source and public goods projects, ensuring transparency and security every step of the way.
            </p>
          </div>
        </CornerFrame>

        {/* Content Sections */}
        <div className="space-y-12">
          <CardBox>
            <h2 className="mb-4 text-2xl font-semibold">🤔 What is Happy Pods?</h2>
            <p className="text-lg">
              Happy Pods is a decentralized platform designed to connect contributors with projects they are passionate about. We solve the core problems of trust and efficiency in distributed collaboration. By forming 'Pods,' teams can work together on specific goals, apply for funding from 'Grants Pools,' and manage their resources transparently. Our mission is to create a sustainable ecosystem for public goods and open-source innovation.
            </p>
          </CardBox>

          <CardBox>
            <h2 className="mb-4 text-2xl font-semibold">🚀 The Pods Flow: For Applicants & Contributors</h2>
            <p className="mb-4 text-lg">
              Joining a Pod is your gateway to meaningful contribution. The process is simple and straightforward:
            </p>
            <ol className="pl-6 space-y-2 text-lg list-decimal">
              <li><strong>Discover:</strong> Browse through existing Pods to find a project that aligns with your skills and interests.</li>
              <li><strong>Apply:</strong> Submit your application to join a Pod. Showcase your expertise and explain why you're a great fit.</li>
              <li><strong>Collaborate:</strong> Once accepted, you become a member of the Pod. Start collaborating with your peers, completing tasks, and achieving project milestones together.</li>
              <li><strong>Earn:</strong> Get rewarded for your contributions as the Pod secures funding and reaches its goals.</li>
            </ol>
          </CardBox>

          <CardBox>
            <h2 className="mb-4 text-2xl font-semibold">💰 The Grants Pool Flow: For Pods & Reviewers</h2>
            <p className="mb-4 text-lg">
              Grants Pools are the funding sources for Pods. The approval process is designed to be transparent and community-driven:
            </p>
            <ol className="pl-6 space-y-2 text-lg list-decimal">
              <li><strong>Proposal Submission:</strong> A Pod submits a detailed funding proposal to a relevant Grants Pool, outlining their objectives, roadmap, and budget.</li>
              <li><strong>Community Review:</strong> The proposal is reviewed by the Grants Pool members or a designated committee. This process values transparency and merit.</li>
              <li><strong>Approval & Funding:</strong> If the proposal is approved, the funds are transferred to the Pod's dedicated multi-signature wallet.</li>
              <li><strong>Milestone Tracking:</strong> The Grants Pool can track the Pod's progress against their stated milestones, ensuring accountability.</li>
            </ol>
          </CardBox>

          <CardBox>
            <h2 className="mb-4 text-2xl font-semibold">🛡️ Security First with <a href="https://safe.global/" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline hover:text-blue-700">Safe{'{'}Wallet{'}'}</a></h2>
            <p className="text-lg">
              Security is paramount. All funds within the Happy Pods ecosystem, for both Pods and Grants Pools, are managed using <a href="https://safe.global/" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline hover:text-blue-700">Safe{'{'}Wallet{'}'}</a>. By leveraging Safe's battle-tested multi-signature smart contracts, we ensure that no single individual can control the funds. Every transaction requires multiple approvals from designated members, providing robust security, preventing unauthorized access, and creating a transparent, auditable trail of all financial activities.
            </p>
          </CardBox>
        </div>
      </div>
    </div>
  );
}