import { HomePageClient } from "@/components/marketing/HomePageClient";
import { buildHomeJsonLd } from "@/lib/seo/home-json-ld";

export default function HomePage() {
  const jsonLd = buildHomeJsonLd();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomePageClient />
    </>
  );
}
