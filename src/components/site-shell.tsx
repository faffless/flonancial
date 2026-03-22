import React from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen text-[#0F1C2E]">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-[#2E88D0] focus:px-4 focus:py-2 focus:text-white">
        Skip to main content
      </a>
      <SiteHeader />
      <div id="main-content">{children}</div>
      <Footer />
    </main>
  );
}

function Footer() {
  return (
    <footer className="mt-10 border-t border-[#B8D0EB]">
      <div className="mx-auto w-full max-w-[1000px] px-6 sm:px-8 lg:px-10">
        <div className="flex flex-col gap-4 py-8 text-sm text-[#2E4A63] sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Flonancial Ltd</p>
          <div className="flex flex-wrap gap-6">
            <Link href="/dashboard" className="hover:text-[#0F1C2E]">Dashboard</Link>
            <Link href="/blog" className="hover:text-[#0F1C2E]">Guides</Link>
            <Link href="/about" className="hover:text-[#0F1C2E]">About</Link>
            <Link href="/privacy" className="hover:text-[#0F1C2E]">Privacy</Link>
            <Link href="/terms" className="hover:text-[#0F1C2E]">Terms</Link>
            <Link href="/disclaimer" className="hover:text-[#0F1C2E]">Disclaimer</Link>
            <a href="mailto:hello@flonancial.co.uk" className="hover:text-[#0F1C2E]">hello@flonancial.co.uk</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
