"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { demoBusinesses, getBusinessTurnover } from "@/data/demo-businesses";

const faqs = [
  { q: "What is Making Tax Digital for Income Tax?", a: "From 6 April 2026, sole traders and landlords earning over £50,000 must keep digital records and submit quarterly updates to HMRC using compatible software. Instead of doing everything in one annual rush, you'll send summary figures four times a year." },
  { q: "Do I have to stop using my spreadsheet?", a: "No. Flonancial is bridging software — it connects your existing spreadsheet to HMRC. You keep your records exactly as you do now. When it's time to submit, upload your file and Flonancial reads just the two numbers HMRC needs: your turnover and your expenses." },
  { q: "What is the Flo tab?", a: "The Flo tab is a simple tab in your spreadsheet with two cells: Turnover and Expenses. If you use our free template, it's already set up with formulas. If you have your own spreadsheet, you add a Flo tab and link it to your existing totals. When you upload, Flonancial reads this tab automatically." },
  { q: "What about the Final Declaration?", a: "Flonancial handles quarterly updates only. For the year-end Final Declaration, you can use HMRC's own online service or another compatible product. This is a common approach — several HMRC-recognised bridging tools work the same way." },
  { q: "Is Flonancial free?", a: "Yes — Flonancial is completely free during beta. No card required. We'll give plenty of notice before introducing any paid plans." },
  { q: "Is my data safe?", a: "Yes. Your spreadsheet is parsed entirely in your browser — the file never touches our servers. We only store the summary figures you submit to HMRC (turnover, expenses, and any other business income). We use HMRC's official OAuth process to connect to your tax account, so we never see or store your HMRC password." },
  { q: "Do I need an accountant?", a: "Not necessarily. Flonancial is designed for straightforward sole trader and landlord cases where you already keep decent records. If your affairs are more complex, it's still sensible to get advice from a qualified accountant." },
  { q: "What if the £50,000 threshold drops?", a: "HMRC has confirmed the threshold will drop to £30,000 from April 2027 and to £20,000 from April 2028. Flonancial is being built to support those future thresholds too." },
  { q: "What does HMRC actually receive?", a: "Just three numbers per quarterly update: your turnover, any other business income (usually zero), and a single total for all your expenses. HMRC never sees individual transactions. The record-keeping obligation — keeping the detail of every transaction — sits with you, the taxpayer, not the software." },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-[#B8D0EB]">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between py-4 text-left text-sm font-medium text-[#0F1C2E] transition hover:text-[#2E88D0]">
        <span>{q}</span>
        <span className="ml-4 shrink-0 text-[#3B5A78]">{open ? "−" : "+"}</span>
      </button>
      {open ? <p className="pb-4 text-sm leading-6 text-[#3B5A78]">{a}</p> : null}
    </div>
  );
}

function formatBusinessType(value: string) {
  if (value === "sole_trader") return "Sole trader";
  if (value === "uk_property") return "UK property";
  if (value === "overseas_property") return "Overseas property";
  return value;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(value);
}

function CopyFloButton() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const text = [
      "Turnover\tyour formula here (e.g. =SUM(Income!C:C))",
      "Expenses\tyour formula here (e.g. =SUM(Expenses!C:C))",
      "",
      "Use formulas to link B1 and B2 to your real income and expense totals \u2014 do not type numbers directly.",
      "Replace the placeholder text in B1 and B2 with your own formulas.",
      "Upload this file to flonancial.co.uk to submit your quarterly update.",
      "",
      "ONE SPREADSHEET, ALL YEAR",
      "",
      "Keep adding transactions to this file throughout the tax year (6 April to 5 April).",
      "Each time you upload to Flonancial, your year-to-date totals are sent to HMRC.",
      "Each submission replaces the previous one \u2014 you do not need a separate file each quarter.",
      "",
      "If you spot a mistake, just correct it in your spreadsheet and upload again next quarter.",
      "HMRC will always use the latest figures you submit.",
      "",
      "QUARTERLY DEADLINES",
      "",
      "Quarter\tPeriod\tSubmit by",
      "Q1\t6 Apr \u2013 5 Jul\t7 August",
      "Q2\t6 Jul \u2013 5 Oct\t7 November",
      "Q3\t6 Oct \u2013 5 Jan\t7 February",
      "Q4\t6 Jan \u2013 5 Apr\t7 May",
      "",
      "2026-27 soft landing: no penalty points for late quarterly updates in the first year.",
      "",
      "WHICH BUSINESS IS THIS FOR?",
      "",
      "Use one spreadsheet per business:",
      "Sole trader \u2014 one spreadsheet for your trade.",
      "UK landlord \u2014 one spreadsheet for ALL your UK properties combined.",
      "Sole trader + landlord \u2014 use a separate spreadsheet (and separate submission) for each.",
      "",
      "HMRC treats each income source as a separate business with its own quarterly updates.",
      "",
      "RECORD KEEPING",
      "",
      "HMRC requires you to record the date, amount, and category of every business transaction.",
      "This spreadsheet is your digital record. Keep it for at least 5 years.",
      "Your paper receipts and invoices can stay on paper \u2014 you do not need to scan them.",
      "Flonancial does not store your transactions. This file is your record.",
      "",
      "WHAT HMRC RECEIVES",
      "",
      "Each quarterly update sends just three numbers to HMRC:",
      "1. Turnover (your total income)",
      "2. Other business income (usually zero \u2014 e.g. grants or insurance payouts)",
      "3. Expenses (your total allowable expenses as a single figure)",
      "",
      "HMRC never sees your individual transactions. The detail stays in this spreadsheet.",
    ].join("\n");

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 rounded-xl bg-[#2E88D0] px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
    >
      {copied ? (
        <>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8.5L6 11.5L13 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          Copied! Paste into cell A1
        </>
      ) : (
        <>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5" /><path d="M3 11V3C3 2.44772 3.44772 2 4 2H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          Copy Flo tab template
        </>
      )}
    </button>
  );
}

export default function HomePage() {
  const router = useRouter();

  return (
    <main className="min-h-screen text-[#0F1C2E]">
      <SiteHeader />
      <section className="mx-auto w-full max-w-[1000px] px-6 py-6 sm:px-8 lg:px-10">

        {/* Hero */}
        <div className="relative overflow-hidden rounded-[28px] border border-[#B8D0EB] bg-[#CCE0F5] px-8 py-10">
          <img src="/wave.png" alt="" className="pointer-events-none absolute bottom-[-60px] left-1/2 z-0 w-[980px] max-w-none -translate-x-1/2 opacity-[0.05]" />
          <div className="relative z-10 mx-auto max-w-[680px] text-center">
            <h1 className="text-[2rem] font-semibold leading-[1.08] tracking-[-0.04em] text-[#0F1C2E] sm:text-[2.6rem] lg:text-[3.2rem]">
              Free & Simple<br />Income Tax MTD for<br />Sole Traders and Landlords
            </h1>
            <p className="mx-auto mt-4 max-w-[600px] text-base leading-7 text-[#3B5A78]">
              Flonancial is bridging software for Making Tax Digital. Simply upload your spreadsheet, review your figures, and submit quarterly updates directly to HMRC. Built for sole traders and landlords earning less than £90,000.
            </p>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* HOW DOES IT WORK — 4 STEPS                                     */}
        {/* ════════════════════════════════════════════════════════════════ */}

        <div className="mt-4">
          <div className="text-center">
            <h2 className="text-2xl font-semibold tracking-tight text-[#0F1C2E]">How does it work?</h2>
            </div>

          {/* ── STEP 1 — Prepare your spreadsheet ────────────────────── */}
          <div className="mt-6">
            <div className="flex items-center justify-center gap-3">
              <span className="inline-flex shrink-0 items-center justify-center rounded-full bg-[#2E88D0] px-3 py-1 text-xs font-bold text-white">Step 1</span>
              <h3 className="text-lg font-semibold text-[#0F1C2E]">Prepare your spreadsheet</h3>
            </div>

            {/* Two-box section with OR divider */}
            <div className="relative mt-4 grid grid-cols-1 gap-4 sm:grid-cols-[2fr_auto_3fr]">
              {/* LEFT — Template download */}
              <div className="rounded-2xl border border-[#B8D0EB] bg-[#CCE0F5] p-6">
                <h4 className="text-base font-semibold text-[#0F1C2E]">Don&apos;t use a spreadsheet yet?</h4>
                <p className="mt-2 text-sm leading-6 text-[#3B5A78]">
                  Download our free template. Just enter your transactions throughout the quarter — the <strong className="text-[#0F1C2E]">Flo</strong> tab auto-calculates everything HMRC needs.
                </p>
                <a
                  href="#"
                  className="mt-4 inline-block rounded-xl bg-[#2E88D0] px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
                >
                  Download Template (.xlsx)
                </a>
                <p className="mt-3 text-xs leading-5 text-[#3B5A78]">
                  Prefer Google Sheets? Copy our template to your Drive, then download as .xlsx (File → Download → Excel) when it&apos;s time to submit.
                </p>
              </div>

              {/* OR divider */}
              <div className="flex items-center justify-center sm:flex-col">
                <div className="h-px w-12 bg-[#B8D0EB] sm:h-full sm:w-px" />
                <span className="mx-3 shrink-0 rounded-full border border-[#B8D0EB] bg-white px-3 py-1 text-xs font-semibold text-[#3B5A78] sm:mx-0 sm:my-3">OR</span>
                <div className="h-px w-12 bg-[#B8D0EB] sm:h-full sm:w-px" />
              </div>

              {/* RIGHT — Existing spreadsheet with 3 visual guides */}
              <div className="rounded-2xl border border-[#B8D0EB] bg-[#CCE0F5] p-6">
                <h4 className="text-base font-semibold text-[#0F1C2E]">Already have a spreadsheet?</h4>
                <p className="mt-2 text-sm leading-6 text-[#3B5A78]">
                  Add a tab called <strong className="text-[#0F1C2E]">Flo</strong> to your existing spreadsheet:
                </p>

                {/* 3 visual guides — no competing numbers */}
                <div className="mt-4 grid grid-cols-3 gap-3">
                  <div className="flex flex-col items-center text-center">
                    <div className="overflow-hidden rounded-lg border border-[#B8D0EB] bg-white">
                      <img
                        src="/flo-steps/step-1-create-tab.png"
                        alt="Create a new tab called Flo"
                        className="h-24 w-full object-cover object-bottom sm:h-28"
                      />
                    </div>
                    <p className="mt-2 text-[11px] leading-4 text-[#3B5A78]">Create a new tab<br />called &quot;Flo&quot;</p>
                  </div>

                  <div className="flex flex-col items-center text-center">
                    <div className="overflow-hidden rounded-lg border border-[#B8D0EB] bg-white">
                      <img
                        src="/flo-steps/step-2-paste-a1.png"
                        alt="Paste into cell A1"
                        className="h-24 w-full object-cover object-top sm:h-28"
                      />
                    </div>
                    <p className="mt-2 text-[11px] leading-4 text-[#3B5A78]">Copy below &amp;<br />paste into A1</p>
                  </div>

                  <div className="flex flex-col items-center text-center">
                    <div className="overflow-hidden rounded-lg border border-[#B8D0EB] bg-white">
                      <img
                        src="/flo-steps/step-3-formulas.png"
                        alt="Replace example formulas with your own"
                        className="h-24 w-full object-cover object-top sm:h-28"
                      />
                    </div>
                    <p className="mt-2 text-[11px] leading-4 text-[#3B5A78]">Replace with your<br />own formulas</p>
                  </div>
                </div>

                <div className="mt-4">
                  <CopyFloButton />
                </div>
              </div>
            </div>
          </div>

          {/* ── STEPS 2, 3, 4 ────────────────────────────────────────── */}
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {[
              { step: "2", title: "Upload to Flonancial", text: "Upload your spreadsheet. Your file is parsed in your browser and never touches our servers. No Flo tab? No problem — just click on the right cells." },
              { step: "3", title: "Review your figures", text: "Flonancial reads your Flo tab automatically. Check your turnover and expenses are correct before anything is submitted." },
              { step: "4", title: "Submit to HMRC", text: "Authorise securely with HMRC and submit your quarterly update directly. Your cumulative figures are sent — done in under a minute." },
            ].map(({ step, title, text }) => (
              <div key={title} className="rounded-2xl border border-[#B8D0EB] bg-[#CCE0F5] p-5 text-center">
                <span className="inline-flex items-center justify-center rounded-full bg-[#2E88D0] px-3 py-1 text-xs font-bold text-white">Step {step}</span>
                <p className="mt-3 text-sm font-medium text-[#0F1C2E]">{title}</p>
                <p className="mt-2 text-sm leading-6 text-[#3B5A78]">{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* See it in action */}
        <div className="mt-8">
          <div className="text-center">
            <h2 className="text-2xl font-semibold tracking-tight text-[#0F1C2E]">See it in action</h2>
            <p className="mt-2 text-sm text-[#3B5A78]">Choose an example business to see how Flonancial works:</p>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {demoBusinesses.slice(0, 4).map((b) => {
              const turnover = getBusinessTurnover(b);
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => router.push(`/demo?business=${b.id}`)}
                  className="rounded-2xl border border-[#B8D0EB] bg-[#CCE0F5] p-4 text-left transition hover:border-[#2E88D0] hover:bg-white"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[#0F1C2E]">{b.emoji} {b.name}</p>
                      <p className="mt-0.5 text-xs text-[#3B5A78]">{b.tagline}</p>
                      <span className="mt-2 inline-block rounded-full border border-[#B8D0EB] bg-[#DEE9F8] px-2 py-0.5 text-[10px] text-[#3B5A78]">
                        {formatBusinessType(b.business_type)}
                      </span>
                      <p className="mt-3 text-xs text-[#3B5A78]">
                        <span className="font-semibold text-[#0F1C2E]">{formatCurrency(turnover)}</span> annual turnover
                      </p>
                    </div>
                    <span className="shrink-0 text-sm text-[#B8D0EB]">→</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Built for sole traders and landlords */}
        <div className="relative mt-8 overflow-hidden rounded-2xl border border-[#B8D0EB] bg-[#CCE0F5] px-8 py-8">
          <img src="/wave.png" alt="" className="pointer-events-none absolute bottom-[-60px] left-1/2 z-0 w-[980px] max-w-none -translate-x-1/2 opacity-[0.05]" />
          <div className="relative z-10">
            <h2 className="text-lg font-semibold text-[#0F1C2E]">Built for sole traders and landlords</h2>
            <ul className="mt-4 space-y-2">
              {[
                "Pure bridging software — we read two numbers and submit them to HMRC",
                "Your spreadsheet is parsed in your browser. The file never touches our servers.",
                "We only store the summary figures you submit — no transactions, no spreadsheet data",
                "Keep your records in your spreadsheet exactly as you do now",
                "Designed for sole traders and UK property landlords earning under £90,000",
                "Secure HMRC connection via official OAuth — we never see your HMRC password",
                "Operated by Flonancial Ltd (Company No. 17090724)",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm leading-6 text-[#3B5A78]">
                  <span className="mt-0.5 shrink-0 text-emerald-600">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Is Flonancial right for you */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-[#0F1C2E]">Is Flonancial right for you?</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {[
              { icon: "🔧", title: "Self-employed", text: "Sole traders who already keep records in a spreadsheet and want the easiest way to do MTD" },
              { icon: "🏠", title: "Landlords", text: "UK property landlords who want simple quarterly filing without changing how they work" },
              { icon: "📊", title: "Spreadsheet users", text: "Anyone already tracking income and expenses in Excel or Google Sheets who wants to keep it that way" },
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
        <div className="relative mt-8 overflow-hidden rounded-2xl border border-[#B8D0EB] bg-[#CCE0F5] px-8 py-8">
          <img src="/wave.png" alt="" className="pointer-events-none absolute bottom-[-60px] left-1/2 z-0 w-[980px] max-w-none -translate-x-1/2 opacity-[0.05]" />
          <div className="relative z-10">
            <h2 className="text-lg font-semibold text-[#0F1C2E]">Frequently asked questions</h2>
            <div className="mt-4">
              {faqs.map((faq) => <FaqItem key={faq.q} q={faq.q} a={faq.a} />)}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-8 rounded-2xl border border-[#B8D0EB] bg-[#CCE0F5] px-8 py-10 text-center">
          <h2 className="text-lg font-semibold text-[#0F1C2E]">Ready to submit?</h2>
          <p className="mx-auto mt-2 max-w-[440px] text-sm leading-6 text-[#3B5A78]">
            Create your free account, connect to HMRC to find your business, and submit your first quarterly update.
          </p>
          <Link href="/login" className="mt-5 inline-block rounded-2xl bg-[#2E88D0] px-6 py-3 text-sm font-medium text-white transition hover:opacity-90">Create your free account</Link>
          <p className="mt-3 text-xs leading-5 text-[#3B5A78]">Free · No card required · Takes under a minute</p>
        </div>
      </section>

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
