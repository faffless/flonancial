import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/site-shell";
import { blogArticles } from "@/data/blog-articles";

export function generateStaticParams() {
  return blogArticles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = blogArticles.find((a) => a.slug === slug);
  if (!article) return {};
  const url = `https://flonancial.co.uk/blog/${article.slug}`;
  return {
    title: `${article.title} — Flonancial`,
    description: article.metaDescription,
    alternates: { canonical: url },
    openGraph: {
      title: article.title,
      description: article.metaDescription,
      url,
      siteName: "Flonancial",
      type: "article",
      locale: "en_GB",
      images: [{ url: `https://flonancial.co.uk${article.image}`, alt: article.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.metaDescription,
    },
  };
}

// Sidebar generated from all blog articles (newest first)

export default async function BlogArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = blogArticles.find((a) => a.slug === slug);
  if (!article) notFound();

  return (
    <SiteShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: article.title,
            description: article.metaDescription,
            image: `https://flonancial.co.uk${article.image}`,
            datePublished: article.publishedDate,
            author: { "@type": "Organization", name: "Flonancial" },
            publisher: { "@type": "Organization", name: "Flonancial", url: "https://flonancial.co.uk" },
          }),
        }}
      />

      <div className="mx-auto flex w-full max-w-[1100px] gap-8 px-6 py-10 sm:px-8">
        {/* ── Sidebar (desktop only) ─────────────────────────────── */}
        <aside className="hidden w-[220px] shrink-0 lg:block">
          <div className="sticky top-8 max-h-[calc(100vh-4rem)] overflow-y-auto">
            <Link href="/tools/tax-calculator" className="block rounded-lg px-2.5 py-1.5 text-xs font-semibold leading-5 text-[#2E88D0] transition hover:bg-[#2E88D0]/10">
              → Tax Calculator
            </Link>

            <p className="mt-3 text-[10px] font-semibold uppercase tracking-widest text-[#5A7A9B]">All Guides</p>
            <nav className="mt-2 flex flex-col gap-0.5">
              {[...blogArticles].reverse().map((a) => {
                const isActive = a.slug === slug;
                return (
                  <Link
                    key={a.slug}
                    href={`/blog/${a.slug}`}
                    className={`rounded-lg px-2.5 py-1.5 text-xs leading-5 transition ${
                      isActive
                        ? "bg-[#DEE9F8] font-medium text-[#0F1C2E]"
                        : "text-[#2E4A63] hover:bg-[#F0F5FB] hover:text-[#0F1C2E]"
                    }`}
                  >
                    {a.title}
                  </Link>
                );
              })}
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

        {/* ── Main article ───────────────────────────────────────── */}
        <article className="min-w-0 max-w-[680px] flex-1">
          <Link href="/blog" className="text-sm text-[#2E4A63] underline underline-offset-4 transition hover:text-[#0F1C2E]">
            ← All guides
          </Link>

          <h1 className="mt-6 text-2xl font-normal tracking-tight text-[#0F1C2E]">{article.title}</h1>
          <p className="mt-2 text-sm text-[#2E4A63]">{article.publishedDate}</p>

          <img
            src={article.image}
            alt={article.title}
            className="mt-6 w-full rounded-2xl object-cover"
          />

          <div
            className="blog-content mt-8 text-sm leading-7 text-[#2E4A63]"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />

          <div className="mt-10 rounded-2xl border border-[#B8D0EB] bg-[#CCE0F5] p-6">
            <p className="text-base font-medium text-[#0F1C2E]">Why is Flonancial free? What's the catch?</p>
            <p className="mt-2 text-sm leading-6 text-[#2E4A63]">There isn't one. Your spreadsheet is processed in your browser — it never touches our servers. HMRC's API is free to use. We don't collect your financial data, we don't sell your information, and we don't show you ads. In 2026, the smart move isn't to charge people for something that costs nearly nothing — it's to build something genuinely useful and earn trust. The core MTD submission will always be free.</p>
            <div className="mt-4 text-center">
              <Link href="/signup" className="inline-block rounded-xl bg-[#2E88D0] px-6 py-2.5 text-sm font-medium text-white transition hover:opacity-90">
                Create your free account
              </Link>
            </div>
          </div>
        </article>
      </div>
    </SiteShell>
  );
}
