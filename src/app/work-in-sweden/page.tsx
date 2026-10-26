import type { Metadata } from "next";
import { ROLES } from "@/lib/seo/axes";

export const metadata: Metadata = {
  title: { absolute: "Work in Sweden — the Swedish you'll need, by role | AlmiSwedish" },
  description:
    "Working in Sweden: how much Swedish each role needs, which CEFR level, and honest readiness practice. Confirm specifics with employers and regulators.",
  alternates: { canonical: "/work-in-sweden" },
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
        <h1 className="text-3xl font-semibold text-almi-ink sm:text-4xl">Work in Sweden</h1>
        <p className="mt-3 max-w-2xl text-base text-almi-text">
          How much Swedish you need depends on the role — client-facing and regulated jobs usually
          expect more, and healthcare roles licensed by Socialstyrelsen have their own language
          requirements, while some technical roles run in English. Pick a role for the language
          pathway, or practise Swedish now.
        </p>
        {industries.map((ind) => (
          <section key={ind} className="mt-8">
            <h2 className="text-sm font-bold uppercase tracking-wide text-almi-text-muted">{ind}</h2>
            <ul className="mt-2 flex flex-wrap gap-2">
              {byIndustry.get(ind)!.map((r) => (
                <li key={r.slug}>
                  <span className="inline-block rounded-full border border-almi-bg-peach bg-almi-paper px-3 py-1.5 text-sm text-almi-ink">
                    {r.name}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
