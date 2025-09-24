import { notFound } from "next/navigation";
import { api } from "~/trpc/server";
import { generatePageMetadata } from "~/lib/metadata";
import { markdownToText } from "~/lib/utils";

type Props = {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
};

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const grantsPool = await api.grantsPool.getById({ id: parseInt(id) });
    return generatePageMetadata("grants-pool", {
      title: `${grantsPool.name} - HappyPods`,
      description: grantsPool.name,
      keywords: [grantsPool.name,...(grantsPool.tags?.split(',') || [])],
    });
  } catch (error) {
    return generatePageMetadata("grants-pool");
  }
}

export default function GrantsPoolDetailLayout({ children }: Props) {
  return <>{children}</>;
}