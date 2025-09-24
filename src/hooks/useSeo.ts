import { useEffect } from "react";
import { seoConfig, type PageSEO } from "~/lib/seo";

export function useSEO(pageKey: string, dynamicData?: Partial<PageSEO>) {
  useEffect(() => {
    const seo: PageSEO = (seoConfig[pageKey as keyof typeof seoConfig] ?? seoConfig.home)!;

    // Apply dynamic data if provided
    const title = dynamicData?.title ?? seo.title;
    const description = dynamicData?.description ?? seo.description;
    const keywords = dynamicData?.keywords ?? seo.keywords;

    // Update document title
    document.title = title;

    // Update meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', description);
    } else {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      metaDescription.setAttribute('content', description);
      document.head.appendChild(metaDescription);
    }

    // Update meta keywords
    let metaKeywords = document.querySelector('meta[name="keywords"]');
    if (metaKeywords) {
      metaKeywords.setAttribute('content', keywords.join(', '));
    } else {
      metaKeywords = document.createElement('meta');
      metaKeywords.setAttribute('name', 'keywords');
      metaKeywords.setAttribute('content', keywords.join(', '));
      document.head.appendChild(metaKeywords);
    }

    // Update Open Graph tags
    updateOrCreateMetaTag('property', 'og:title', title);
    updateOrCreateMetaTag('property', 'og:description', description);
    updateOrCreateMetaTag('property', 'og:type', 'website');
    updateOrCreateMetaTag('property', 'og:site_name', 'HappyPods');

    // Update Twitter Card tags
    updateOrCreateMetaTag('name', 'twitter:card', 'summary_large_image');
    updateOrCreateMetaTag('name', 'twitter:title', title);
    updateOrCreateMetaTag('name', 'twitter:description', description);

  }, [pageKey, dynamicData?.title, dynamicData?.description, JSON.stringify(dynamicData?.keywords)]);
}

function updateOrCreateMetaTag(attributeName: string, attributeValue: string, content: string) {
  let metaTag = document.querySelector(`meta[${attributeName}="${attributeValue}"]`);
  if (metaTag) {
    metaTag.setAttribute('content', content);
  } else {
    metaTag = document.createElement('meta');
    metaTag.setAttribute(attributeName, attributeValue);
    metaTag.setAttribute('content', content);
    document.head.appendChild(metaTag);
  }
}