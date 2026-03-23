import Link from "next/link";
import type { Metadata } from "next";
import { SiteShell } from "@/components/site-shell";
import { blogArticles } from "@/data/blog-articles";

export const metadata: Metadata = {
  title: "MTD Guides & Resources — Flonancial",
  description: "Free guides, comparisons, and resources for Making Tax Digital. Everything sole traders and landlords need to know about MTD for Income Tax.",
  alternates: { canonical: "https://flonancial.co.uk/blog" },
  openGraph: {
    title: "MTD Guides & Resources — Flonancial",
    description: "Free guides, comparisons, and resources for Making Tax Digital.",
    url: "https://flonancial.co.uk/blog",
    siteName: "Flonancial",
    type: "website",
    locale: "en_GB",
  },
};

const categoryLabels: Record<string, string> = {
  guide: "Guide",
  comparison: "Comparison",
  reference: "Reference",
};

export default function BlogIndexPage() {
  return (
    <SiteShell>
      <div className="mx-auto flex w-full max-w-[1100px] gap-8 px-6 py-10 sm:px-8">
        {/* ── Sidebar (desktop only) ─────────────────────────────── */}
        <aside className="hidden w-[220px] shrink-0 lg:block">
          <div className="sticky top-8 max-h-[calc(100vh-4rem)] overflow-y-auto">
            <Link href="/tools/tax-calculator" className="block rounded-lg px-2.5 py-1.5 text-xs font-semibold leading-5 text-[#2E88D0] transition hover:bg-[#2E88D0]/10">
              → Tax Calculator
            </Link>

            <p className="mt-3 text-[10px] font-semibold uppercase tracking-widest text-[#5A7A9B]">All Guides</p>
            <nav className="mt-2 flex flex-col gap-0.5">
              {[...blogArticles].reverse().map((a) => (
                <Link
                  key={a.slug}
                  href={`/blog/${a.slug}`}
                  className="rounded-lg px-2.5 py-1.5 text-xs leading-5 text-[#2E4A63] transition hover:bg-[#F0F5FB] hover:text-[#0F1C2E]"
                >
                  {a.title}
                </Link>
              ))}
            </nav>

            <div className="mt-6 rounded-xl border border-[#B8D0EB] bg-[#F0F5FB] p-4">
              <p className="text-xs font-medium text-[#0F1C2E]">Free MTD submissions</p>
              <p className="mt-1 text-[11px] leading-4 text-[#2E4A63]">Upload your spreadsheet and submit to HMRC in minutes.</p>
              <Link href="/signup" className="mt-3 block rounded-lg bg-[#2E88D0] py-2 text-center text-xs font-medium text-white transition hover:opacity-90">
                Create free account
              </Link>
            </div>
          </div>
        </aside>

        {/* ── Main content ───────────────────────────────────────── */}
        <section className="min-w-0 flex-1">
          <h1 className="text-2xl font-normal tracking-tight text-[#0F1C2E]">Guides & resources</h1>
          <p className="mt-2 text-sm text-[#2E4A63]">
            Everything you need to know about Making Tax Digital for Income Tax.
          </p>

          <div className="mt-8 space-y-4">
            {[...blogArticles].reverse().map((article) => (
              <Link
                key={article.slug}
                href={`/blog/${article.slug}`}
                className="group block overflow-hidden rounded-2xl border border-[#B8D0EB] bg-[#CCE0F5] transition hover:border-[#2E88D0] hover:shadow-md"
              >
                <img
                  src={article.image}
                  alt={article.title}
                  className="h-40 w-full object-cover sm:h-48"
                />
                <div className="p-5 sm:p-6">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-[#B8D0EB] bg-[#F0F5FB] px-2 py-0.5 text-[10px] text-[#2E4A63]">
                      {categoryLabels[article.category] ?? article.category}
                    </span>
                    <span className="text-[10px] text-[#2E4A63]">{article.publishedDate}</span>
                  </div>
                  <h2 className="mt-2 text-base font-medium text-[#0F1C2E]">{article.title}</h2>
                  <p className="mt-1 text-sm text-[#2E4A63]">{article.metaDescription}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </SiteShell>
  );
}
