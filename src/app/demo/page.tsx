"use client";

import Link from "next/link";
import { useMemo, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteShell } from "@/components/site-shell";
import { demoBusinesses, getDemoBusiness, type DemoBusiness } from "@/data/demo-businesses";

type TaxYear = { label: string; start: string; end: string };

type Quarter = {
  label: string;
  quarterStart: string;
  quarterEnd: string;
  periodKey: string;
  turnover: number;
  expenses: number;
  cumulativeTurnover: number;
  cumulativeExpenses: number;
  isCurrent: boolean;
  isFuture: boolean;
  isPast: boolean;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function toInputDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getTaxYear(transactions: { date: string }[]): TaxYear {
  const now = new Date();
  const year = now.getFullYear();
  let yearEnd = new Date(year, 3, 5);
  if (now > yearEnd) yearEnd = new Date(year + 1, 3, 5);
  const yearStart = new Date(yearEnd);
  yearStart.setFullYear(yearStart.getFullYear() - 1);
  yearStart.setDate(yearStart.getDate() + 1);

  // If no transactions fall in current year, use the year the transactions are in
  const currentStart = toInputDate(yearStart);
  const currentEnd = toInputDate(yearEnd);
  const hasCurrent = transactions.some((t) => t.date >= currentStart && t.date <= currentEnd);
  if (hasCurrent) {
    return { label: `${yearStart.getFullYear()}–${String(yearEnd.getFullYear()).slice(2)}`, start: currentStart, end: currentEnd };
  }

  // Fall back to whatever year has most transactions
  const firstTx = transactions[0];
  if (!firstTx) return { label: `${yearStart.getFullYear()}–${String(yearEnd.getFullYear()).slice(2)}`, start: currentStart, end: currentEnd };

  const d = new Date(`${firstTx.date}T00:00:00`);
  const y = d.getFullYear();
  let ye = new Date(y, 3, 5);
  if (d > ye) ye = new Date(y + 1, 3, 5);
  const ys = new Date(ye);
  ys.setFullYear(ys.getFullYear() - 1);
  ys.setDate(ys.getDate() + 1);
  return { label: `${ys.getFullYear()}–${String(ye.getFullYear()).slice(2)}`, start: toInputDate(ys), end: toInputDate(ye) };
}

function getQuarters(taxYear: TaxYear, transactions: { date: string; type: string; amount: number }[]): Quarter[] {
  const now = new Date();
  const cursor = new Date(`${taxYear.start}T00:00:00`);
  const quarters: Quarter[] = [];
  let cumulativeTurnover = 0;
  let cumulativeExpenses = 0;

  for (let i = 0; i < 4; i++) {
    const periodStart = new Date(cursor);
    const periodEnd = new Date(cursor);
    periodEnd.setMonth(periodEnd.getMonth() + 3);
    periodEnd.setDate(periodEnd.getDate() - 1);
    const quarterStart = toInputDate(periodStart);
    const quarterEnd = toInputDate(periodEnd);
    const isFuture = new Date(`${quarterStart}T00:00:00`) > now;
    const isPast = new Date(`${quarterEnd}T23:59:59`) < now;
    const isCurrent = !isFuture && !isPast;

    const qTx = transactions.filter((t) => t.date >= quarterStart && t.date <= quarterEnd);
    const turnover = qTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expenses = qTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    cumulativeTurnover += turnover;
    cumulativeExpenses += expenses;

    let label = `Q${i + 1}`;
    if (isCurrent) label += " · current";
    else if (isFuture) label += " · upcoming";

    quarters.push({
      label,
      quarterStart,
      quarterEnd,
      periodKey: `${quarterStart}_${quarterEnd}`,
      turnover,
      expenses,
      cumulativeTurnover,
      cumulativeExpenses,
      isCurrent,
      isFuture,
      isPast,
    });

    cursor.setMonth(cursor.getMonth() + 3);
  }

  return quarters;
}

const DEADLINES = ["7 Aug", "7 Nov", "7 Feb", "7 May"];

function SignUpBanner() {
  return (
    <div className="rounded-2xl border border-[#2E88D0]/30 bg-[#2E88D0]/10 px-6 py-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[#0F1C2E]">Ready to submit your own?</p>
          <p className="mt-1 text-sm text-[#2E4A63]">Create a free account, connect to HMRC, and submit your first quarterly update.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/login" className="rounded-xl bg-[#2E88D0] px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90">Create free account →</Link>
        </div>
      </div>
    </div>
  );
}

function BusinessSwitcher({ currentId, onSwitch }: { currentId: string; onSwitch: (id: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {demoBusinesses.map((b) => (
        <button key={b.id} type="button" onClick={() => onSwitch(b.id)} className={`rounded-xl border px-3 py-1.5 text-xs transition ${b.id === currentId ? "border-[#2E88D0] bg-[#2E88D0] text-white" : "border-[#B8D0EB] bg-[#DEE9F8] text-[#2E4A63] hover:bg-[#CCE0F5] hover:text-[#0F1C2E]"}`}>
          {b.emoji} {b.name}
        </button>
      ))}
    </div>
  );
}

function BusinessView({ business, onSwitch }: { business: DemoBusiness; onSwitch: (id: string) => void }) {
  const transactions = business.transactions;
  const taxYear = useMemo(() => getTaxYear(transactions), [transactions]);
  const quarters = useMemo(() => getQuarters(taxYear, transactions), [taxYear, transactions]);

  // Progress: how many quarters are "submitted" in this demo view
  const [submittedCount, setSubmittedCount] = useState(1);

  const annualTotals = useMemo(() => {
    const yt = transactions.filter((t) => t.date >= taxYear.start && t.date <= taxYear.end);
    return {
      income: yt.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0),
      expenses: yt.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0),
    };
  }, [transactions, taxYear]);

  return (
    <div>
      {/* Demo banner */}
      <div className="rounded-2xl border border-amber-600/20 bg-amber-50 px-5 py-3">
        <p className="text-sm text-amber-700">
          This is a demo with sample data for <strong>{business.name}</strong> ({business.tagline}). Sign up to submit your own figures to HMRC.
        </p>
      </div>

      {/* Tax year bar */}
      <div className="mt-4 flex flex-wrap items-center gap-4 rounded-2xl border border-[#B8D0EB] bg-[#CCE0F5] px-4 py-3">
        <div className="flex items-center gap-2">
          <label className="text-xs text-[#2E4A63]">Tax year</label>
          <span className="rounded-xl border border-[#B8D0EB] bg-white px-3 py-1.5 text-sm text-[#0F1C2E]">{taxYear.label}</span>
        </div>
        <div className="h-4 w-px bg-[#B8D0EB]" />
        <p className="text-xs text-[#2E4A63]">{formatDate(taxYear.start)} – {formatDate(taxYear.end)}</p>
        <div className="h-4 w-px bg-[#B8D0EB]" />
        <p className="text-xs text-[#2E4A63]">Annual income: <span className="font-medium text-[#0F1C2E]">{formatCurrency(annualTotals.income)}</span></p>
        <p className="text-xs text-[#2E4A63]">Annual expenses: <span className="font-medium text-[#0F1C2E]">{formatCurrency(annualTotals.expenses)}</span></p>
      </div>

      {/* Time progression */}
      <div className="mt-4">
        <p className="text-xs font-medium text-[#2E4A63]">See what your dashboard looks like:</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {[
            { count: 1, label: "Q1 submitted" },
            { count: 2, label: "Q2 submitted" },
            { count: 3, label: "Q3 submitted" },
            { count: 4, label: "All 4 submitted" },
          ].map(({ count, label }) => (
            <button
              key={count}
              type="button"
              onClick={() => setSubmittedCount(count)}
              className={`rounded-xl border px-3 py-1.5 text-xs font-medium transition ${
                submittedCount === count
                  ? "border-[#2E88D0] bg-[#2E88D0] text-white"
                  : "border-[#B8D0EB] bg-[#DEE9F8] text-[#2E4A63] hover:bg-[#CCE0F5] hover:text-[#0F1C2E]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Quarterly cards */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {quarters.map((q, i) => {
          const qIndex = i + 1;
          const isSubmitted = qIndex <= submittedCount;
          const isNext = qIndex === submittedCount + 1;
          const isUpcoming = qIndex > submittedCount + 1;
          const isCoveredByLater = isSubmitted && qIndex < submittedCount;

          return (
            <div
              key={q.periodKey}
              className={`rounded-2xl border p-4 ${
                isSubmitted
                  ? "border-emerald-600/20 bg-emerald-50"
                  : isNext
                  ? "border-[#2E88D0]/30 bg-[#CCE0F5]"
                  : "border-[#B8D0EB] bg-[#DEE9F8] opacity-50"
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#2E4A63]">Q{qIndex}{isNext ? " · next" : ""}</p>
                {isSubmitted ? (
                  <span className="rounded-full border border-emerald-600/20 bg-emerald-100 px-2 py-0.5 text-[10px] text-emerald-700">
                    {isCoveredByLater ? "Covered" : "Submitted"}
                  </span>
                ) : isNext ? (
                  <span className="rounded-full border border-amber-600/20 bg-amber-100 px-2 py-0.5 text-[10px] text-amber-700">Not submitted</span>
                ) : null}
              </div>

              {/* Dates & deadline */}
              <p className="mt-2 text-[11px] text-[#2E4A63]">{formatDate(q.quarterStart)} – {formatDate(q.quarterEnd)}</p>
              <p className="mt-0.5 text-[10px] text-[#2E4A63]">Due: {DEADLINES[i]}</p>

              {/* Figures */}
              {isSubmitted ? (
                <div className="mt-3 space-y-1">
                  <p className="text-xs text-[#2E4A63]">Turnover: <span className="font-medium text-[#0F1C2E]">{formatCurrency(q.cumulativeTurnover)}</span></p>
                  <p className="text-xs text-[#2E4A63]">Expenses: <span className="font-medium text-[#0F1C2E]">{formatCurrency(q.cumulativeExpenses)}</span></p>
                  <p className="mt-1 text-[10px] text-[#2E4A63] italic">Cumulative year-to-date</p>
                </div>
              ) : isNext ? (
                <div className="mt-3 space-y-1">
                  <p className="text-xs text-[#2E4A63]">Turnover: <span className="font-medium text-[#0F1C2E]">{formatCurrency(q.cumulativeTurnover)}</span></p>
                  <p className="text-xs text-[#2E4A63]">Expenses: <span className="font-medium text-[#0F1C2E]">{formatCurrency(q.cumulativeExpenses)}</span></p>
                </div>
              ) : null}

              {/* Actions */}
              <div className="mt-3">
                {isSubmitted && !isCoveredByLater ? (
                  <p className="text-[10px] text-emerald-600">✓ Sent to HMRC</p>
                ) : isSubmitted && isCoveredByLater ? (
                  <p className="text-[10px] text-[#2E4A63]">Covered by later submission</p>
                ) : isNext ? (
                  <Link href="/login" className="rounded-lg bg-[#2E88D0] px-3 py-1.5 text-xs font-medium text-white transition hover:opacity-90">
                    Upload & Submit →
                  </Link>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {/* Submission history (visible when at least 1 submitted) */}
      {submittedCount >= 1 ? (
        <div className="mt-6">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-[#2E4A63]">Submission history</p>
          <div className="overflow-hidden rounded-2xl border border-[#B8D0EB]">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#CCE0F5] text-[#2E4A63] text-xs uppercase tracking-wide">
                  <th className="px-4 py-3 text-left font-semibold">Period</th>
                  <th className="px-4 py-3 text-right font-semibold">Turnover</th>
                  <th className="px-4 py-3 text-right font-semibold">Expenses</th>
                  <th className="px-4 py-3 text-right font-semibold">Other</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {quarters.slice(0, submittedCount).reverse().map((q, i) => (
                  <tr key={q.periodKey} className={i % 2 === 0 ? "bg-white" : "bg-[#f4f8fd]"}>
                    <td className="px-4 py-3 text-xs text-[#0F1C2E]">{formatDate(q.quarterStart)} – {formatDate(q.quarterEnd)}</td>
                    <td className="px-4 py-3 text-right text-xs font-medium text-[#0F1C2E]">{formatCurrency(q.cumulativeTurnover)}</td>
                    <td className="px-4 py-3 text-right text-xs font-medium text-[#0F1C2E]">{formatCurrency(q.cumulativeExpenses)}</td>
                    <td className="px-4 py-3 text-right text-xs text-[#2E4A63]">£0.00</td>
                    <td className="px-4 py-3 text-xs text-emerald-600">Submitted</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {/* Year-end note */}
      <div className="mt-6 rounded-2xl border border-[#B8D0EB] bg-[#DEE9F8] px-6 py-5">
        <p className="text-sm font-medium text-[#0F1C2E]">Final Declaration (year-end)</p>
        <p className="mt-1 text-xs leading-5 text-[#2E4A63]">
          Flonancial handles quarterly updates only. For the year-end Final Declaration, use{" "}
          <a href="https://www.gov.uk/personal-tax-account" target="_blank" rel="noopener noreferrer" className="text-[#2E88D0] underline hover:no-underline">
            HMRC&apos;s online service
          </a>{" "}
          or another compatible product. The deadline is 31 January following the end of the tax year.
        </p>
      </div>

      {/* Sign up CTA */}
      <div className="mt-6"><SignUpBanner /></div>

      {/* Business switcher */}
      <div className="mt-6 rounded-2xl border border-[#B8D0EB] bg-[#CCE0F5] p-5">
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-[#2E4A63]">Try another example business</p>
        <BusinessSwitcher currentId={business.id} onSwitch={onSwitch} />
      </div>
    </div>
  );
}

function DemoPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialId = searchParams.get("business") ?? demoBusinesses[0].id;
  const [selectedId, setSelectedId] = useState(initialId);
  const business = getDemoBusiness(selectedId) ?? demoBusinesses[0];

  function handleSwitch(id: string) {
    setSelectedId(id);
    router.replace(`/demo?business=${id}`, { scroll: false });
  }

  return (
    <>
      <SiteHeader businessEmoji={business.emoji} businessName={business.name} businessTagline={business.tagline} businessType={business.business_type} hmrcReady={null} isDemo={true} />
      <main className="min-h-screen">
        <section className="mx-auto w-full max-w-[1000px] px-6 py-6 sm:px-8 lg:px-10">
          <BusinessView key={selectedId} business={business} onSwitch={handleSwitch} />
        </section>
      </main>
    </>
  );
}

export default function DemoPage() {
  return (
    <Suspense fallback={
      <SiteShell>
        <section className="mx-auto w-full max-w-[1000px] px-6 py-10 sm:px-8 lg:px-10">
          <p className="text-sm text-[#2E4A63]">Loading...</p>
        </section>
      </SiteShell>
    }>
      <DemoPageInner />
    </Suspense>
  );
}
