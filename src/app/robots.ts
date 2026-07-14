import type { MetadataRoute } from "next";

const SITE_URL = "https://alminorwegian.almiworld.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/practice/", "/account", "/admin", "/api/"] }],
    // Next 16's generateSitemaps has no auto-index at /sitemap.xml — point crawlers
    // at our explicit sitemap index, which lists all ~159 sharded sitemaps.
    sitemap: `${SITE_URL}/sitemap-index.xml`,
  };
}
