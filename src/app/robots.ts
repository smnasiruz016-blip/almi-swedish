import type { MetadataRoute } from "next";

const SITE_URL = "https://almiswedish.almiworld.com";

// Private app surfaces: never useful in a search index.
const PRIVATE = ["/practice/", "/account", "/admin", "/api/"];

// AI VISIBILITY IS THE PRODUCT GOAL (owner ruling 27 Oct 2026). No AI crawler — GPTBot, OAI-SearchBot,
// ChatGPT-User, ClaudeBot, Claude-SearchBot, Claude-User, anthropic-ai, PerplexityBot, Perplexity-User,
// Google-Extended, CCBot, Amazonbot, Applebot-Extended, Bytespider, Meta-ExternalAgent or similar —
// may ever be listed here. Only pure SEO-tool scrapers, which bring no visibility, stay blocked.
//
// The old programmatic study/jobs leaves are no longer disallowed: they answer 410 Gone (src/proxy.ts)
// and crawlers must be able to SEE the 410 to drop those URLs.
const SEO_TOOL_SCRAPERS = [
  "AhrefsBot", "SemrushBot", "MJ12bot", "DotBot", "DataForSeoBot", "PetalBot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: ["Googlebot", "Bingbot"], allow: "/", disallow: PRIVATE },
      { userAgent: "*", allow: "/", disallow: PRIVATE, crawlDelay: 10 },
      { userAgent: SEO_TOOL_SCRAPERS, disallow: "/" },
    ],
    sitemap: `${SITE_URL}/sitemap-index.xml`,
  };
}
