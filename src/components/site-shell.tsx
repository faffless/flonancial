import React from "react";
import Link from "next/link";

export function SiteShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen text-white">
      <Header />
      <div>{children}</div>
      <Footer />
    </main>
  );
}

function Header() {
  return (
    <header className="bg-transparent">
      <div className="mx-auto w-full max-w-[1000px] px-6 sm:px-8 lg:px-10">
        <div className="flex items-center justify-end py-0">
          <nav className="flex items-center text-sm font-medium text-white/70">
            <Link href="/about" className="transition hover:text-white">
              About Flonancial.co.uk
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="mt-10 border-t border-white/10">
      <div className="mx-auto w-full max-w-[1000px] px-6 sm:px-8 lg:px-10">
        <div className="flex flex-col gap-4 py-8 text-sm text-white/60 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Flonancial</p>

          <div className="flex flex-wrap gap-6">
            <Link
              href="/privacy"
              className="underline underline-offset-4 hover:text-white"
            >
              Privacy
            </Link>

            <Link
              href="/security"
              className="underline underline-offset-4 hover:text-white"
            >
              Security
            </Link>

            <Link
              href="/about"
              className="underline underline-offset-4 hover:text-white"
            >
              About
            </Link>

            <Link
              href="/disclaimer"
              className="underline underline-offset-4 hover:text-white"
            >
              Disclaimer
            </Link>

            <a
              href="mailto:hello@flonancial.co.uk"
              className="underline underline-offset-4 hover:text-white"
            >
              hello@flonancial.co.uk
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}