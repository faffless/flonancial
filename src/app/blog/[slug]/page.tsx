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
  return {
    title: `${article.title} — Flonancial`,
    description: article.metaDescription,
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
    <SiteShell>
      <article className="mx-auto w-full max-w-[680px] px-6 py-10 sm:px-8">
        <Link href="/blog" className="text-sm text-[#2E4A63] underline underline-offset-4 transition hover:text-[#0F1C2E]">
          ← All guides
        </Link>

        <h1 className="mt-6 text-2xl font-normal tracking-tight text-[#0F1C2E]">{article.title}</h1>
        <p className="mt-2 text-sm text-[#2E4A63]">{article.publishedDate}</p>

        <div
          className="blog-content mt-8 text-sm leading-7 text-[#2E4A63]"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />

        <div className="mt-10 rounded-2xl border border-[#B8D0EB] bg-[#CCE0F5] p-6 text-center">
          <p className="text-base font-medium text-[#0F1C2E]">Ready to submit your quarterly updates?</p>
          <p className="mt-2 text-sm text-[#2E4A63]">Flonancial is free bridging software for sole traders and landlords. Upload your spreadsheet and submit to HMRC in minutes.</p>
          <Link href="/signup" className="mt-4 inline-block rounded-xl bg-[#2E88D0] px-6 py-2.5 text-sm font-medium text-white transition hover:opacity-90">
            Create your free account
          </Link>
        </div>
      </article>
    </SiteShell>
  );
}
