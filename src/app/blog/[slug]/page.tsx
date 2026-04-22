import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
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

export default async function BlogArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = blogArticles.find((a) => a.slug === slug);
  if (!article) notFound();

  return (
    <article className="max-w-[680px]">
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

      <div className="mt-10 rounded-2xl border border-[#B8D0EB] bg-[#CCE0F5] p-6 text-center">
        <p className="text-base font-medium text-[#0F1C2E]">Why is Flonancial free? What's the catch?</p>
        <p className="mt-2 text-sm leading-6 text-[#2E4A63]">There isn't one. Your spreadsheet is processed in your browser — it never touches our servers. HMRC's API is free to use. We don't collect your financial data, we don't sell your information, and we don't show you ads. In 2026, the smart move isn't to charge people for something that costs nearly nothing — it's to build something genuinely useful and earn trust. The core MTD submission will always be free.</p>
        <div className="mt-4">
          <Link href="/signup" className="inline-block rounded-xl bg-[#2E88D0] px-6 py-2.5 text-sm font-medium text-white transition hover:opacity-90">
            Create your free account
          </Link>
        </div>
      </div>
    </article>
  );
}
