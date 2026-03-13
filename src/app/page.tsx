import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

export default function HomePage() {
  return (
    <main className="min-h-screen text-white">
      <SiteHeader
        navItems={[
          { href: "/login", label: "Log in" },
        ]}
      />

      <section className="mx-auto w-full max-w-[1000px] px-6 py-8 sm:px-8 lg:px-10">

        <div className="rounded-[28px] border border-white/10 bg-white/[0.03] px-8 py-14">
          <div className="mx-auto max-w-[580px] text-center">

            <h1 className="text-[2.8rem] font-semibold leading-[1.04] tracking-[-0.05em] text-white sm:text-[3.8rem] lg:text-[4.4rem]">
              Free MTD tax submissions for the self-employed
            </h1>

            <p className="mx-auto mt-6 max-w-[440px] text-base leading-7 text-white/65">
              Submit your quarterly Making Tax Digital updates directly to HMRC. No accountant needed.
            </p>

            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/login"
                className="rounded-2xl border border-white/10 bg-white px-6 py-3 text-sm font-medium text-black transition hover:opacity-90"
              >
                Get started free
              </Link>
              <Link
                href="/about"
                className="rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-3 text-sm text-white/80 transition hover:bg-white/[0.07] hover:text-white"
              >
                What is MTD?
              </Link>
            </div>

            <p className="mt-5 text-xs leading-5 text-white/35">
              Free while Flonancial is in beta. Simple, low-cost pricing will be introduced later — early users will always get the best deal.
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
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
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
            <p>© {new Date().getFullYear()} Flonancial</p>
            <div className="flex flex-wrap gap-6">
              <Link href="/privacy" className="hover:text-white">Privacy</Link>
              <Link href="/about" className="hover:text-white">About</Link>
              <Link href="/disclaimer" className="hover:text-white">Disclaimer</Link>
              <a href="mailto:hello@flonancial.co.uk" className="hover:text-white">hello@flonancial.co.uk</a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}