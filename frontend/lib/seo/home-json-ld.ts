import { websiteConfig } from "@/lib/website-config";
import { getSiteUrl } from "@/lib/site";

export function buildHomeJsonLd() {
  const url = getSiteUrl();
  const repo = websiteConfig.github.repo;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: "AI-CS",
        url,
        sameAs: [repo],
      },
      {
        "@type": "SoftwareApplication",
        name: "AI-CS 智能客服系统",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web · Docker 私有化部署",
        description:
          "开源 AI 客服系统，支持多模型对话、知识库向量检索（RAG）、提示词工程、人工协作与可观测运营。",
        url,
        codeRepository: repo,
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
      },
    ],
  };
}
