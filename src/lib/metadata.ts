import type { Metadata } from "next";
import { seoConfig, type PageSEO } from "~/lib/seo";

export function generatePageMetadata(
  pageKey: string,
  dynamicData?: Partial<PageSEO>
): Metadata {
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
      siteName: "HappyPods",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
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
  };
}