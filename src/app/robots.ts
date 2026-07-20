import type { MetadataRoute } from "next";

const SITE_URL = "https://almiswedish.almiworld.com";

const DEEP_LEAVES = ["/study-in-sweden/*/from/", "/work-in-sweden/*/from/"];

const HEAVY_BOTS = [
  "GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "anthropic-ai",
  "CCBot", "Bytespider", "Amazonbot", "PerplexityBot", "Google-Extended",
  "AhrefsBot", "SemrushBot", "MJ12bot", "DotBot", "DataForSeoBot", "PetalBot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: ["Googlebot", "Bingbot"], allow: "/", disallow: ["/practice/", "/account", "/admin", "/api/"] },
      { userAgent: "*", allow: "/", disallow: ["/practice/", "/account", "/admin", "/api/", ...DEEP_LEAVES], crawlDelay: 10 },
      { userAgent: HEAVY_BOTS, disallow: "/" },
    ],
    sitemap: `${SITE_URL}/sitemap-index.xml`,
  };
}
