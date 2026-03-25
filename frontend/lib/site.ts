/** 官网绝对地址（用于 SEO、sitemap、OG）。未配置时使用 README 中的演示站。 */
export function getSiteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://demo.cscorp.top";
  return raw.replace(/\/$/, "");
}
