"use client";

import Link from "next/link";
import { useState } from "react";
import { SiteHeader } from "@/components/site-header";

const faqs = [
  {
    q: "What is Making Tax Digital for Income Tax?",
    a: "From 6 April 2026, sole traders and landlords earning over £50,000 must keep digital records and submit quarterly updates to HMRC using compatible software. This replaces the single annual Self Assessment tax return with four quarterly submissions plus a year-end Final Declaration.",
  },
  {
    q: "Do I have to stop using my spreadsheet?",
    a: "No. That's the whole point of bridging software. You keep your records in your spreadsheet exactly as you do now. Flonancial reads your file, extracts the figures, and submits them to HMRC. Your workflow doesn't change.",
  },
  {
    q: "What about the Final Declaration?",
    a: "Flonancial handles your four quarterly updates. For the year-end Final Declaration (due 31 January), you can use HMRC's own online service or another compatible product. We plan to add Final Declaration support in a future update.",
  },
  {
    q: "Is Flonancial free?",
    a: "Flonancial is free during the beta period. We plan to introduce pricing after the beta — well below what the big accounting platforms charge. You'll get plenty of notice before any charges apply.",
  },
  {
    q: "Is my data safe?",
    a: "Your data is stored on encrypted UK-based servers. We use HMRC's official OAuth process to connect to your tax account — we never see or store your HMRC password. HMRC access tokens are stored in secure, encrypted cookies and are never exposed to the browser.",
  },
  {
    q: "Do I need an accountant?",
    a: "Flonancial is a software tool, not tax advice. If your affairs are straightforward — simple sole trade or rental income — you can handle your quarterly updates yourself. If you're unsure about anything, we'd always recommend speaking to a qualified accountant.",
  },
  {
    q: "What if the £50,000 threshold drops?",
    a: "HMRC has confirmed the threshold will drop to £30,000 from April 2027 and to £20,000 from April 2028. Flonancial will support all thresholds as they come into effect.",
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-[#B8D0EB]">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-4 text-left text-sm font-medium text-[#0F1C2E] hover:text-[#2E88D0] transition"
      >
        <span>{q}</span>
        <span className="ml-4 shrink-0 text-[#3B5A78]">{open ? "−" : "+"}</span>
      </button>
      {open ? (
        <p className="pb-4 text-sm leading-6 text-[#3B5A78]">{a}</p>
      ) : null}
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="min-h-screen text-[#0F1C2E]">
      <SiteHeader />
      <section className="mx-auto w-full max-w-[1000px] px-6 py-6 sm:px-8 lg:px-10">

        {/* Hero */}
        <div className="relative overflow-hidden rounded-[28px] border border-[#B8D0EB] bg-[#CCE0F5] px-8 py-10">
          <img
            src="/wave.png"
            alt=""
            className="pointer-events-none absolute bottom-[-60px] left-1/2 z-0 w-[980px] max-w-none -translate-x-1/2 opacity-[0.05]"
          />
          <div className="relative z-10 mx-auto max-w-[680px] text-center">
            <h1 className="text-[2rem] font-semibold leading-[1.08] tracking-[-0.04em] text-[#0F1C2E] sm:text-[2.6rem] lg:text-[3.2rem]">
              Submit MTD<br />Quarterly Updates.<br />Keep Your Spreadsheet.
            </h1>
            <p className="mx-auto mt-4 max-w-[600px] text-base leading-7 text-[#3B5A78]">
              Flonancial is bridging software for Making Tax Digital. Upload your spreadsheet, review your figures, and submit directly to HMRC.<br />Built for sole traders and landlords earning less than £90,000.
            </p>
            <div className="mt-6 flex justify-center">
              <Link href="/login" className="rounded-2xl bg-[#2E88D0] px-6 py-3 text-sm font-medium text-white transition hover:opacity-90">
                Get started free
              </Link>
            </div>
            <p className="mt-4 text-xs leading-5 text-[#3B5A78]">
              Free during beta · No credit card required
            </p>
          </div>
        </div>

        {/* 3 boxes */}
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {[
            {
              title: "Upload your files",
              text: "Keep your records in Excel, CSV, or Google Sheets — however you already work. Upload your file and Flonancial reads your figures automatically. No retyping. No reformatting.",
            },
            {
              title: "Review your figures",
              text: "See your income and expenses broken down by quarter. Check everything looks right before you submit. You're always in control of what goes to HMRC.",
            },
            {
              title: "Submit to HMRC",
              text: "One click sends your quarterly update directly to HMRC through their official API. You get instant confirmation. Done in minutes, not hours.",
            },
          ].map(({ title, text }) => (
            <div key={title} className="rounded-2xl border border-[#B8D0EB] bg-[#CCE0F5] p-5 text-center">
              <p className="text-sm font-medium text-[#0F1C2E]">{title}</p>
              <p className="mt-2 text-sm leading-6 text-[#3B5A78]">{text}</p>
            </div>
          ))}
        </div>

        {/* Built for people who keep good records */}
        <div className="relative mt-5 overflow-hidden rounded-2xl border border-[#B8D0EB] bg-[#CCE0F5] px-8 py-8">
          <img src="/wave.png" alt="" className="pointer-events-none absolute bottom-[-60px] left-1/2 z-0 w-[980px] max-w-none -translate-x-1/2 opacity-[0.05]" />
          <div className="relative z-10">
          <h2 className="text-lg font-semibold text-[#0F1C2E]">Built for people who already keep good records</h2>
</div>
          <ul className="mt-4 space-y-2">
            {[
              "Compliant HMRC bridging software — your spreadsheet is the digital link",
              "Supports sole trader and UK property income",
              "Cumulative quarterly updates, exactly as HMRC requires",
              "Your data stays in the UK on secure, encrypted servers",
              "We never see your HMRC password — we use HMRC's official OAuth process",
              "Operated by Flonancial Ltd (Company No. 17090724)",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm leading-6 text-[#3B5A78]">
                <span className="mt-0.5 shrink-0 text-emerald-600">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Is Flonancial right for you */}
        <div className="mt-5">
          <h2 className="text-lg font-semibold text-[#0F1C2E]">Is Flonancial right for you?</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {[
              {
                icon: "🔧",
                title: "Self-employed",
                text: "Sole traders earning over £50,000 who need to comply with MTD from April 2026",
              },
              {
                icon: "🏠",
                title: "Landlords",
                text: "UK property landlords with rental income over £50,000 who need quarterly reporting",
              },
              {
                icon: "📊",
                title: "Spreadsheet users",
                text: "Anyone who already tracks income and expenses in Excel or Google Sheets and wants to keep it that way",
              },
            ].map(({ icon, title, text }) => (
              <div key={title} className="rounded-2xl border border-[#B8D0EB] bg-[#CCE0F5] p-5">
                <p className="text-2xl">{icon}</p>
                <p className="mt-2 text-sm font-medium text-[#0F1C2E]">{title}</p>
                <p className="mt-1 text-sm leading-6 text-[#3B5A78]">{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="relative mt-5 overflow-hidden rounded-2xl border border-[#B8D0EB] bg-[#CCE0F5] px-8 py-8">
          <img src="/wave.png" alt="" className="pointer-events-none absolute bottom-[-60px] left-1/2 z-0 w-[980px] max-w-none -translate-x-1/2 opacity-[0.05]" />
          <div className="relative z-10">
          <h2 className="text-lg font-semibold text-[#0F1C2E]">Frequently asked questions</h2>
          <div className="mt-4">
            {faqs.map((faq) => (
              <FaqItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
</div>
        </div>

        {/* CTA */}
        <div className="mt-5 rounded-2xl border border-[#B8D0EB] bg-[#CCE0F5] px-8 py-10 text-center">
          <h2 className="text-xl font-semibold text-[#0F1C2E]">MTD starts in 20 days. Get ready now.</h2>
          <p className="mt-2 text-sm leading-6 text-[#3B5A78]">
            Join the beta and be among the first to submit your quarterly updates through Flonancial.
          </p>
          <div className="mt-6">
            <Link href="/login" className="rounded-2xl bg-[#2E88D0] px-6 py-3 text-sm font-medium text-white transition hover:opacity-90">
              Join the beta — it's free
            </Link>
          </div>
        </div>

      </section>

      {/* Footer */}
      <footer className="mt-10 border-t border-[#B8D0EB]">
        <div className="mx-auto w-full max-w-[1000px] px-6 sm:px-8 lg:px-10">
          <div className="flex flex-col gap-4 py-8 text-sm text-[#3B5A78] sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} Flonancial Ltd</p>
            <div className="flex flex-wrap gap-6">
              <Link href="/about" className="hover:text-[#0F1C2E]">About</Link>
              <Link href="/privacy" className="hover:text-[#0F1C2E]">Privacy</Link>
              <Link href="/terms" className="hover:text-[#0F1C2E]">Terms</Link>
              <Link href="/disclaimer" className="hover:text-[#0F1C2E]">Disclaimer</Link>
              <a href="mailto:hello@flonancial.co.uk" className="hover:text-[#0F1C2E]">hello@flonancial.co.uk</a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}