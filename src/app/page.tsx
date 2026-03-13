import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

export default function HomePage() {
  return (
    <main className="min-h-screen text-white">
      <SiteHeader />

      <section className="mx-auto w-full max-w-[1000px] px-6 py-6 sm:px-8 lg:px-10">
        <div className="rounded-[28px] border border-white/10 bg-white/[0.03] px-8 py-10">
          <div className="mx-auto max-w-[680px] text-center">
            <h1 className="text-[2rem] font-semibold leading-[1.08] tracking-[-0.04em] text-white sm:text-[2.6rem] lg:text-[3.2rem]">
              Free & Simple<br />MTD Submissions<br />For Income Tax (ITSA) 
            </h1>
            <p className="mx-auto mt-4 max-w-[600px] text-base leading-7 text-white/65">
              Submit your quarterly Making Tax Digital updates directly to HMRC.<br />Built for sole traders and landlords. Tax year 2025–26 onwards.<br />No accountant needed.
            </p>
            <div className="mt-6 flex justify-center">
              <Link
                href="/login"
                className="rounded-2xl border border-white/10 bg-white px-6 py-3 text-sm font-medium text-black transition hover:opacity-90"
              >
                Get started free
              </Link>
            </div>
            <p className="mt-4 text-xs leading-5 text-white/35">
              We may introduce optional upgrades in future, but submitting your MTD updates will always be free on Flonancial.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {[
            {
              title: "Connect to HMRC",
              text: "Link your HMRC account securely using official OAuth. No passwords stored.",
            },
            {
              title: "Log your figures",
              text: "Add your quarterly turnover and expenses. Takes minutes.",
            },
            {
              title: "Submit directly",
              text: "Send your update straight to HMRC. Flonancial handles the rest.",
            },
          ].map(({ title, text }) => (
            <div
              key={title}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-center"
            >
              <p className="text-sm font-medium text-white">{title}</p>
              <p className="mt-2 text-sm leading-6 text-white/55">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="mt-10 border-t border-white/10">
        <div className="mx-auto w-full max-w-[1000px] px-6 sm:px-8 lg:px-10">
          <div className="flex flex-col gap-4 py-8 text-sm text-white/60 sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} Flonancial Ltd</p>
            <div className="flex flex-wrap gap-6">
              <Link href="/about" className="hover:text-white">About</Link>
              <Link href="/privacy" className="hover:text-white">Privacy</Link>
              <Link href="/terms" className="hover:text-white">Terms</Link>
              <Link href="/disclaimer" className="hover:text-white">Disclaimer</Link>
              <a href="mailto:hello@flonancial.co.uk" className="hover:text-white">hello@flonancial.co.uk</a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}