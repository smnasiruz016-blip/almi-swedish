import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SUBJECT_BY_SLUG, SUBJECTS, COUNTRIES, UNIVERSITIES, studyPath } from "@/lib/seo/axes";

export const dynamicParams = false;
export function generateStaticParams() { return SUBJECTS.map((s) => ({ subject: s.slug })); }

type Params = Promise<{ subject: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { subject } = await params;
  const s = SUBJECT_BY_SLUG.get(subject);
  if (!s) return { title: "Not found" };
  return {
    title: { absolute: `Study ${s.name} in Norway — Norwegian-language pathway | AlmiNorwegian` },
    description: `The Norwegian-language route for studying ${s.name} in Norway — typical CEFR level and honest readiness practice, by country of origin.`,
    alternates: { canonical: `/study-in-norway/${s.slug}` },
  };
}

export default async function SubjectHub({ params }: { params: Params }) {
  const { subject } = await params;
  const s = SUBJECT_BY_SLUG.get(subject);
  if (!s) notFound();
  const refUni = UNIVERSITIES[0];
  // Link out to a sample of origin countries (full matrix is crawled via sitemap).
  const sample = COUNTRIES.slice(0, 60);
  return (
    <main className="bg-almi-bg text-almi-text">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <nav aria-label="Breadcrumb" className="mb-6 text-xs text-almi-text-muted">
          <Link href="/study-in-norway" className="hover:text-almi-coral">Study in Norway</Link> / {s.name}
        </nav>
        <h1 className="text-3xl font-semibold text-almi-ink sm:text-4xl">Study {s.name} in Norway</h1>
        <p className="mt-3 max-w-2xl text-base text-almi-text">
          The University of Copenhagen, Aarhus University and the University of Southern Norway offer {s.name} programmes; most
          Norwegian-taught courses ask for around B2. Pick your country of origin for the language pathway, or start
          practising the Norwegian exams now.
        </p>
        <div className="mt-6">
          <Link href="/exams" className="text-sm font-semibold text-almi-coral hover:underline">See the Norwegian exam guides →</Link>
        </div>
        <h2 className="mt-10 text-lg font-semibold text-almi-ink">By country of origin</h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {sample.map((c) => (
            <li key={c.slug}>
              <Link href={studyPath(s.slug, c.slug, refUni.slug)} className="inline-block rounded-full border border-almi-bg-peach bg-almi-paper px-3 py-1.5 text-sm text-almi-ink hover:border-almi-coral">
                {c.flag} {c.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
