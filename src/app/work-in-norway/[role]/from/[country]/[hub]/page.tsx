import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ROLE_BY_SLUG, COUNTRY_BY_SLUG, HUB_BY_SLUG } from "@/lib/seo/axes";
import { buildJobsPage } from "@/lib/seo/content";
import { resolveOriginBlock } from "@/lib/seo/origin-localization";
import { FunnelPage } from "@/components/seo/FunnelPage";

// Cache indefinitely (Localization Standard rule #5) — no periodic ISR re-writes.
export const dynamicParams = true;
export const revalidate = false;
export function generateStaticParams() { return []; }

type Params = Promise<{ role: string; country: string; hub: string }>;

function resolve(role: string, country: string, hub: string) {
  const r = ROLE_BY_SLUG.get(role);
  const c = COUNTRY_BY_SLUG.get(country);
  const h = HUB_BY_SLUG.get(hub);
  if (!r || !c || !h) return null;
  return { r, c, h };
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { role, country, hub } = await params;
  const x = resolve(role, country, hub);
  if (!x) return { title: "Not found" };
  const p = buildJobsPage(x.r, x.c, x.h, resolveOriginBlock(x.c));
  return {
    title: p.metaTitle,
    description: p.metaDescription,
    alternates: { canonical: p.canonicalPath },
    robots: p.indexable ? undefined : { index: false, follow: true },
    openGraph: { title: p.h1, description: p.metaDescription },
  };
}

export default async function Page({ params }: { params: Params }) {
  const { role, country, hub } = await params;
  const x = resolve(role, country, hub);
  if (!x) notFound();
  return <FunnelPage page={buildJobsPage(x.r, x.c, x.h, resolveOriginBlock(x.c))} />;
}
