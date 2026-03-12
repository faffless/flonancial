import { SiteShell } from "@/components/site-shell";

export default function AboutPage() {
  return (
    <SiteShell>
      <section className="mx-auto w-full max-w-[1000px] px-6 py-10 sm:px-8 lg:px-10">
        <div className="max-w-3xl rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
          <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">
            About
          </p>

          <h1 className="mt-2 text-2xl font-normal tracking-tight text-white">
            About Flonancial
          </h1>

          <p className="mt-4 text-sm leading-6 text-white/75">
            Flonancial provides simple informational tools and guidance to help
            people understand tax and finance topics more clearly.
          </p>

          <p className="mt-4 text-sm leading-6 text-white/75">
            The current focus is a narrow, practical journey toward Making Tax
            Digital support, starting with simple tools and a private tester
            experience.
          </p>

          <p className="mt-4 text-sm leading-6 text-white/75">
            This website is designed to give general information only. It does
            not provide personalised tax, legal, or financial advice.
          </p>
        </div>
      </section>
    </SiteShell>
  );
}