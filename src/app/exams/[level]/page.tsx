import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ALL_EXAMS, examBySlug } from "@/lib/no/registry";
import { buildLevelPage } from "@/lib/seo/content";
import { FunnelPage } from "@/components/seo/FunnelPage";

// Citizenship + University + CEFR levels — pre-render all at build.
export const dynamicParams = false;
export function generateStaticParams() {
  return ALL_EXAMS.map((e) => ({ level: e.slug }));
}

type Params = Promise<{ level: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { level } = await params;
  const exam = examBySlug(level);
  if (!exam) return { title: "Not found" };
  const p = buildLevelPage(exam);
  return {
    title: p.metaTitle,
    description: p.metaDescription,
    alternates: { canonical: p.canonicalPath },
    openGraph: { title: p.h1, description: p.metaDescription },
  };
}

export default async function Page({ params }: { params: Params }) {
  const { level } = await params;
  const exam = examBySlug(level);
  if (!exam) notFound();
  return <FunnelPage page={buildLevelPage(exam)} />;
}
