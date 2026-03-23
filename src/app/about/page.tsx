import type { Metadata } from "next";
import { SiteShell } from "@/components/site-shell";

export const metadata: Metadata = {
  title: "About Flonancial — Free Making Tax Digital Software",
  description: "Flonancial is free MTD bridging software for sole traders and landlords. Connect your spreadsheet to HMRC and submit quarterly updates in minutes.",
  alternates: { canonical: "https://flonancial.co.uk/about" },
};

export default function AboutPage() {
  return (
    <SiteShell>
      <section className="mx-auto w-full max-w-[640px] px-6 py-10 sm:px-8">
        <div className="rounded-2xl border border-[#B8D0EB] bg-[#CCE0F5] p-5 sm:p-8">

          <h1 className="text-2xl font-normal tracking-tight text-[#0F1C2E]">About Flonancial</h1>

          <div className="mt-8 space-y-8 text-sm leading-7 text-[#2E4A63]">

            <div>
              <h2 className="text-base font-medium text-[#0F1C2E]">Why I built this</h2>
              <p className="mt-3">
                I&apos;ve worked in small company finance for twenty years. I spend my days
                inside the kind of software that Making Tax Digital is about to push millions
                of people toward — large, expensive platforms that have been bolting on features
                for years without stopping to ask whether any of it actually works properly.
              </p>
              <p className="mt-3">
                When I heard that sole traders and landlords would soon be required to submit
                quarterly updates to HMRC digitally, I thought about all the people who would
                be forced into that same world — not because they need accounting software,
                but because the law now says they need compatible software to send three
                numbers to HMRC four times a year.
              </p>
              <p className="mt-3">
                The mechanics of a quarterly update are simple. You&apos;re sending your
                turnover, your expenses, and any other income. That&apos;s it. There is no
                good reason to charge people a monthly subscription for that.
              </p>
            </div>

            <div>
              <h2 className="text-base font-medium text-[#0F1C2E]">What Flonancial does</h2>
              <p className="mt-3">
                Flonancial is free bridging software for Making Tax Digital. It connects your
                existing spreadsheet to HMRC so you can submit your quarterly updates directly,
                without switching to accounting software or paying a monthly fee.
              </p>
              <p className="mt-3">
                Upload your spreadsheet, pick the cells containing your turnover and expenses,
                review your figures, and submit. That&apos;s the whole process. Your spreadsheet
                is parsed entirely in your browser — the file never touches our servers.
              </p>
              <p className="mt-3">
                I connect to HMRC using their official OAuth system, so I never see or store
                your Government Gateway password. The only data I keep is the summary figures
                you submit and the HMRC confirmation reference.
              </p>
              <p className="mt-3">
                The name comes from the idea of finances that just flow — simple,
                friction-free, and straightforward.
              </p>
            </div>

            <div>
              <h2 className="text-base font-medium text-[#0F1C2E]">Who this is for</h2>
              <p className="mt-3">
                From April 2026, sole traders and landlords earning over £50,000 must submit
                quarterly updates to HMRC digitally. The threshold drops to £30,000 in 2027
                and £20,000 in 2028. Millions of people will need compatible software.
              </p>
              <p className="mt-3">
                If you already keep decent records in a spreadsheet and just need a way to
                get your figures to HMRC, Flonancial is built for you. If your affairs are
                more complex and you need invoicing, payroll, or bank feeds, a full accounting
                platform is probably the right choice — but you shouldn&apos;t have to pay
                for all of that just to submit a quarterly update.
              </p>
            </div>

            <div>
              <h2 className="text-base font-medium text-[#0F1C2E]">Where things stand</h2>
              <p className="mt-3">
                Flonancial has completed HMRC sandbox testing and is awaiting production
                approval. Once approved, you&apos;ll be able to connect your HMRC account
                and start submitting real quarterly updates.
              </p>
              <p className="mt-3">
                In the meantime, you can create an account, explore the interface, and try
                the <a href="/demo" className="text-[#2E88D0] hover:opacity-75">demo</a> to
                see how it works.
              </p>
            </div>

            <div>
              <h2 className="text-base font-medium text-[#0F1C2E]">The company</h2>
              <p className="mt-3">
                Flonancial is built and operated by me — Will. I pursue this enthusiastically
                because I genuinely believe the software industry overcharges for simple things,
                and I registered Flonancial Ltd to do this properly.
              </p>
              <p className="mt-3">
                Flonancial Ltd is registered in England and Wales. Company number: 17090724.
                Registered office: 104 Finborough Road, London, SW10 9ED.
              </p>
              <p className="mt-3">
                No venture capital, no investors, no corporate backing. Just a straightforward
                product that does what it says — because meeting a legal obligation shouldn&apos;t
                cost you a monthly subscription.
              </p>
              <p className="mt-3">
                If you have questions, feedback, or something&apos;s not working, email me
                directly at <a href="mailto:hello@flonancial.co.uk" className="text-[#2E88D0] hover:opacity-75">hello@flonancial.co.uk</a>.
              </p>
            </div>

            <div className="rounded-xl border border-[#B8D0EB] bg-[#DEE9F8] p-5 text-center">
              <p className="text-base font-medium text-[#0F1C2E]">Ready to try it?</p>
              <p className="mt-2 text-sm text-[#2E4A63]">
                Create a free account and see how simple MTD submissions can be.
              </p>
              <a href="/signup" className="mt-4 inline-block rounded-xl bg-[#2E88D0] px-6 py-2.5 text-sm font-medium text-white transition hover:opacity-90">
                Create my free account
              </a>
            </div>

          </div>
        </div>
      </section>
    </SiteShell>
  );
}