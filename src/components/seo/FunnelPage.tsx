import Link from "next/link";
import type { SeoPage } from "@/lib/seo/content";
import { MISSION_LINE } from "@/lib/seo/content";

// Shared server-rendered layout for every programmatic SEO page (study / jobs /
// level). Emits JSON-LD, breadcrumbs, honest body, FAQ, internal links, and the
// trial CTA. No client JS.
export function FunnelPage({ page }: { page: SeoPage }) {
  return (
    <main className="bg-almi-bg text-almi-text">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(page.jsonLd) }} />

      <div className="mx-auto max-w-3xl px-6 py-12">
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="mb-6 text-xs text-almi-text-muted">
          <ol className="flex flex-wrap items-center gap-1">
            <li><Link href="/" className="hover:text-almi-coral">Home</Link></li>
            {page.breadcrumbs.map((b) => (
              <li key={b.path} className="flex items-center gap-1">
                <span aria-hidden>/</span>
                <Link href={b.path} className="hover:text-almi-coral">{b.name}</Link>
              </li>
            ))}
          </ol>
        </nav>

        <header>
          <h1 className="text-3xl font-semibold leading-tight text-almi-ink sm:text-4xl">{page.h1}</h1>
          {page.subtitle && <p className="mt-2 text-sm font-medium text-almi-text-muted">{page.subtitle}</p>}
        </header>

        <div className="mt-6 space-y-4">
          {page.intro.map((p, i) => (
            <p key={i} className="text-base text-almi-text">{p}</p>
          ))}
        </div>

        {page.sections.map((s) => (
          <section key={s.heading} className="mt-10">
            <h2 className="text-xl font-semibold text-almi-ink">{s.heading}</h2>
            <div className="mt-3 space-y-3">
              {s.body.map((b, i) => (
                <p key={i} className="text-base text-almi-text">{b}</p>
              ))}
            </div>
          </section>
        ))}

        {/* Trial CTA band */}
        <section className="mt-10 rounded-2xl border border-almi-bg-peach bg-almi-paper p-6 text-center shadow-sm">
          <p className="text-base font-semibold text-almi-ink">Practise Norwegian with honest readiness.</p>
          <Link
            href="/signup"
            className="mt-4 inline-flex min-h-[48px] items-center justify-center rounded-full bg-almi-coral px-7 py-3 text-base font-semibold text-almi-ink hover:bg-almi-coral-deep"
          >
            Start your 7-day free trial
          </Link>
          <p className="mt-3 text-xs text-almi-text-muted">$12/month after the trial · cancel anytime · {MISSION_LINE}</p>
        </section>

        {/* FAQ */}
        {page.faq.length > 0 && (
          <section className="mt-10">
            <h2 className="text-xl font-semibold text-almi-ink">Questions</h2>
            <dl className="mt-4 space-y-4">
              {page.faq.map((f) => (
                <div key={f.q} className="rounded-2xl border border-almi-bg-peach bg-almi-paper p-5">
                  <dt className="font-semibold text-almi-ink">{f.q}</dt>
                  <dd className="mt-1 text-sm text-almi-text">{f.a}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        {/* Internal links */}
        {page.related.length > 0 && (
          <section className="mt-10">
            <h2 className="text-lg font-semibold text-almi-ink">Related</h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {page.related.map((r) => (
                <li key={r.href}>
                  <Link href={r.href} className="inline-block rounded-full border border-almi-bg-peach bg-almi-paper px-3 py-1.5 text-sm text-almi-ink hover:border-almi-coral">
                    {r.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  );
}
