import React from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen text-white">
      <SiteHeader />
      <div>{children}</div>
      <Footer />
    </main>
  );
}

function Footer() {
  return (
    <footer className="mt-10 border-t border-white/10">
      <div className="mx-auto w-full max-w-[1000px] px-6 sm:px-8 lg:px-10">
        <div className="flex flex-col gap-4 py-8 text-sm text-white/60 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Flonancial Ltd</p>
          <div className="flex flex-wrap gap-6">
            <Link href="/dashboard" className="hover:text-white">Dashboard</Link>
            <Link href="/account" className="hover:text-white">Account</Link>
            <Link href="/about" className="hover:text-white">About</Link>
            <Link href="/privacy" className="hover:text-white">Privacy</Link>
            <Link href="/terms" className="hover:text-white">Terms</Link>
            <Link href="/disclaimer" className="hover:text-white">Disclaimer</Link>
            <a href="mailto:hello@flonancial.co.uk" className="hover:text-white">hello@flonancial.co.uk</a>
          </div>
        </div>
      </div>
    </footer>
  );
}