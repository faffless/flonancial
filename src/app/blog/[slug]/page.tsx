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

// Sidebar links — guides and tools shown on desktop
const sidebarLinks = [
  { label: "Tax Calculator", href: "/tools/tax-calculator", highlight: true },
  { label: "All guides", href: "/blog" },
  { label: "Can You Use Excel for MTD?", href: "/blog/can-you-use-excel-for-making-tax-digital" },
  { label: "Free MTD Bridging Software", href: "/blog/free-mtd-bridging-software" },
  { label: "MTD for Landlords", href: "/blog/making-tax-digital-for-landlords" },
  { label: "MTD Software Comparison", href: "/blog/mtd-software-comparison-2026" },
  { label: "How to Submit Your First Update", href: "/blog/how-to-submit-first-mtd-quarterly-update" },
  { label: "Best Free MTD Software", href: "/blog/best-free-making-tax-digital-software-2026" },
  { label: "Free MTD Spreadsheet Template", href: "/blog/free-mtd-spreadsheet-template" },
  { label: "Do I Need an Accountant?", href: "/blog/do-i-need-accountant-for-mtd" },
  { label: "MTD for Contractors", href: "/blog/making-tax-digital-for-contractors" },
  { label: "Self-Employed Tax Calculator", href: "/blog/self-employed-tax-calculator-2025-26" },
  { label: "Free Spreadsheet Software", href: "/blog/free-spreadsheet-software-for-mtd" },
  { label: "MTD & Mortgages", href: "/blog/making-tax-digital-mortgage-self-employed" },
];

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
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#5A7A9B]">Tools &amp; Guides</p>
            <nav className="mt-3 flex flex-col gap-1">
              {sidebarLinks.map((link) => {
                const isActive = link.href === `/blog/${slug}`;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`rounded-lg px-2.5 py-1.5 text-xs leading-5 transition ${
                      link.highlight
                        ? "font-semibold text-[#2E88D0] hover:bg-[#2E88D0]/10"
                        : isActive
                        ? "bg-[#DEE9F8] font-medium text-[#0F1C2E]"
                        : "text-[#2E4A63] hover:bg-[#F0F5FB] hover:text-[#0F1C2E]"
                    }`}
                  >
                    {link.highlight && "→ "}{link.label}
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
