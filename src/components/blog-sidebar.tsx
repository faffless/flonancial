"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { blogArticles } from "@/data/blog-articles";

export function BlogSidebar() {
  const pathname = usePathname();
  const activeSlug = pathname.startsWith("/blog/") ? pathname.slice("/blog/".length) : null;

  return (
    <aside className="hidden w-[220px] shrink-0 lg:block">
      <div className="sticky top-8 max-h-[calc(100vh-4rem)] overflow-y-auto">
        <Link
          href="/tools/tax-calculator"
          className="block rounded-lg px-2.5 py-1.5 text-xs font-semibold leading-5 text-[#2E88D0] transition hover:bg-[#2E88D0]/10"
        >
          → Tax Calculator
        </Link>

        <p className="mt-3 text-[10px] font-semibold uppercase tracking-widest text-[#5A7A9B]">All Guides</p>
        <nav className="mt-2 flex flex-col gap-0.5">
          {[...blogArticles].reverse().map((a) => {
            const isActive = a.slug === activeSlug;
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
  );
}
