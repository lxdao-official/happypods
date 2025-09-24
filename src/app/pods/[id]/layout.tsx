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
    const podDetail = await api.pod.getPodDetail({ id: parseInt(id) });
    return {
      title: `${podDetail.title} - HappyPods`,
      description: podDetail.title,
      keywords: [podDetail.title,...(podDetail.tags?.split(',') || [])],
    }
  } catch (error) {
    return generatePageMetadata("pods");
  }
}

export default function PodDetailLayout({ children }: Props) {
  return <>{children}</>;
}