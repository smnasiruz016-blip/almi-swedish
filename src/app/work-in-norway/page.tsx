import type { Metadata } from "next";
import Link from "next/link";
import { ROLES } from "@/lib/seo/axes";

export const metadata: Metadata = {
  title: { absolute: "Work in Norway — the Norwegian you'll need, by role | AlmiNorwegian" },
  description:
    "Working in Norway: how much Norwegian each role needs, which CEFR level, and honest readiness practice. Confirm specifics with employers and regulators.",
  alternates: { canonical: "/work-in-norway" },
};

export default function WorkHub() {
  // Group roles by industry for a crawlable, organised hub.
  const byIndustry = new Map<string, typeof ROLES>();
  for (const r of ROLES) {
    const arr = byIndustry.get(r.industry) ?? [];
    arr.push(r);
    byIndustry.set(r.industry, arr);
  }
  const industries = [...byIndustry.keys()].sort();
  return (
    <main className="bg-almi-bg text-almi-text">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="text-3xl font-semibold text-almi-ink sm:text-4xl">Work in Norway</h1>
        <p className="mt-3 max-w-2xl text-base text-almi-text">
          How much Norwegian you need depends on the role — client-facing and regulated jobs usually expect more,
          while some technical roles run in English. Pick a role for the language pathway, or practise Norwegian now.
        </p>
        {industries.map((ind) => (
          <section key={ind} className="mt-8">
            <h2 className="text-sm font-bold uppercase tracking-wide text-almi-text-muted">{ind}</h2>
            <ul className="mt-2 flex flex-wrap gap-2">
              {byIndustry.get(ind)!.map((r) => (
                <li key={r.slug}>
                  <Link href={`/work-in-norway/${r.slug}`} className="inline-block rounded-full border border-almi-bg-peach bg-almi-paper px-3 py-1.5 text-sm text-almi-ink hover:border-almi-coral">
                    {r.name}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
