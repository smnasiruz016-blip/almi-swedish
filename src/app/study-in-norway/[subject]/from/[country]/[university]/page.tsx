import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SUBJECT_BY_SLUG, COUNTRY_BY_SLUG, UNI_BY_SLUG } from "@/lib/seo/axes";
import { buildStudyPage } from "@/lib/seo/content";
import { resolveOriginBlock } from "@/lib/seo/origin-localization";
import { FunnelPage } from "@/components/seo/FunnelPage";

// ISR on-demand: nothing pre-rendered at build; each URL renders + caches on
// first request. Cache indefinitely (Localization Standard rule #5) — the axis
// data only changes on redeploy, which cold-starts the cache. No periodic
// re-writes (the ISR-Writes cost driver).
export const dynamicParams = true;
export const revalidate = false;
export function generateStaticParams() { return []; }

type Params = Promise<{ subject: string; country: string; university: string }>;

function resolve(subject: string, country: string, university: string) {
  const s = SUBJECT_BY_SLUG.get(subject);
  const c = COUNTRY_BY_SLUG.get(country);
  const u = UNI_BY_SLUG.get(university);
  if (!s || !c || !u) return null;
  return { s, c, u };
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { subject, country, university } = await params;
  const r = resolve(subject, country, university);
  if (!r) return { title: "Not found" };
  const p = buildStudyPage(r.s, r.c, r.u, resolveOriginBlock(r.c));
  return {
    title: p.metaTitle,
    description: p.metaDescription,
    alternates: { canonical: p.canonicalPath },
    robots: p.indexable ? undefined : { index: false, follow: true },
    openGraph: { title: p.h1, description: p.metaDescription },
  };
}

export default async function Page({ params }: { params: Params }) {
  const { subject, country, university } = await params;
  const r = resolve(subject, country, university);
  if (!r) notFound();
  return <FunnelPage page={buildStudyPage(r.s, r.c, r.u, resolveOriginBlock(r.c))} />;
}
