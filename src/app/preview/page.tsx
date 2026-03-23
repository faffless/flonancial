"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import TaxEstimate from "@/components/tax-estimate";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

function formatDate(value: string) {
  return new Date(`${value}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

function toInputDate(date: Date) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

type TaxYear = { label: string; start: string; end: string };
type Quarter = {
  label: string;
  quarterStart: string;
  quarterEnd: string;
  periodKey: string;
  isCurrent: boolean;
  isFuture: boolean;
  isPast: boolean;
};

function getCurrentTaxYear(): TaxYear {
  const now = new Date();
  const year = now.getUTCFullYear();
  const april5 = new Date(Date.UTC(year, 3, 5));
  let yearEnd: Date;
  if (now <= april5) {
    yearEnd = april5;
  } else {
    yearEnd = new Date(Date.UTC(year + 1, 3, 5));
  }
  const yearStart = new Date(yearEnd);
  yearStart.setUTCFullYear(yearStart.getUTCFullYear() - 1);
  yearStart.setUTCDate(yearStart.getUTCDate() + 1);

  const startYear = yearStart.getUTCFullYear();
  const endYear = yearEnd.getUTCFullYear();
  return {
    label: `${startYear}–${String(endYear).slice(2)}`,
    start: toInputDate(yearStart),
    end: toInputDate(yearEnd),
  };
}

function getQuarters(taxYear: TaxYear): Quarter[] {
  const now = new Date();
  const cursor = new Date(`${taxYear.start}T00:00:00Z`);
  const quarters: Quarter[] = [];

  for (let i = 0; i < 4; i++) {
    const periodStart = new Date(cursor);
    const periodEnd = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 3, cursor.getUTCDate() - 1));

    const quarterStart = toInputDate(periodStart);
    const quarterEnd = toInputDate(periodEnd);
    const isFuture = new Date(`${quarterStart}T00:00:00Z`) > now;
    const isPast = new Date(`${quarterEnd}T23:59:59Z`) < now;
    const isCurrent = !isFuture && !isPast;

    let label = `Q${i + 1}`;
    if (isCurrent) label += " · current";
    else if (isFuture) label += " · upcoming";

    quarters.push({
      label,
      quarterStart,
      quarterEnd,
      periodKey: `${quarterStart}_${quarterEnd}`,
      isCurrent,
      isFuture,
      isPast,
    });

    cursor.setUTCMonth(cursor.getUTCMonth() + 3);
  }

  return quarters;
}

const DEADLINES: Record<number, string> = {
  0: "5 Aug",
  1: "5 Nov",
  2: "5 Feb",
  3: "5 May",
};

// ─── Main page ────────────────────────────────────────────────────────────────

export default function PreviewPage() {
  const router = useRouter();
  const [turnover, setTurnover] = useState<number | null>(null);
  const [expenses, setExpenses] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("flo_prefill");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (typeof parsed.turnover === "number") setTurnover(parsed.turnover);
        if (typeof parsed.expenses === "number") setExpenses(parsed.expenses);
      }
    } catch {}
    setLoaded(true);
  }, []);

  const taxYear = useMemo(() => getCurrentTaxYear(), []);
  const quarters = useMemo(() => getQuarters(taxYear), [taxYear]);

  // Find the current or most recent non-future quarter for the figures
  const activeQuarterIndex = useMemo(() => {
    const currentIdx = quarters.findIndex((q) => q.isCurrent);
    if (currentIdx !== -1) return currentIdx;
    // Fall back to latest past quarter
    for (let i = quarters.length - 1; i >= 0; i--) {
      if (quarters[i].isPast) return i;
    }
    return 0;
  }, [quarters]);

  const hasFigures = turnover !== null && expenses !== null;

  function handleSignUp() {
    router.push("/signup");
  }

  if (!loaded) {
    return (
      <SiteHeader businessEmoji="" businessName="Your Business" businessTagline="" businessType="" hmrcReady={null} />
    );
  }

  if (!hasFigures) {
    // No figures in sessionStorage — redirect to landing page
    router.replace("/");
    return null;
  }

  return (
    <>
      <SiteHeader
        businessEmoji=""
        businessName="Your Business"
        businessTagline="Preview — connect to HMRC to confirm your business details"
        businessType=""
        hmrcReady={null}
      />
      <main className="min-h-screen">
        <section className="mx-auto w-full max-w-[1000px] px-6 py-6 sm:px-8 lg:px-10">

          {/* Preview banner */}
          <div className="rounded-2xl border border-[#2E88D0]/30 bg-[#2E88D0]/10 px-6 py-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-[#0F1C2E]">This is a preview of your dashboard</p>
                <p className="mt-1 text-sm text-[#2E4A63]">Your spreadsheet figures are shown below. Create a free account and connect to HMRC to submit them.</p>
              </div>
              <button
                type="button"
                onClick={handleSignUp}
                className="rounded-xl bg-[#2E88D0] px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
              >
                Create free account →
              </button>
            </div>
          </div>

          {/* Preview-only notice */}
          <div className="mt-4 rounded-xl border border-[#B8D0EB] bg-[#DEE9F8] px-4 py-3">
            <p className="text-xs text-[#2E4A63]">
              Preview figures are not stored. After signing up and connecting to HMRC, you&apos;ll upload your spreadsheet again from your business page — this ensures your data is authenticated and securely linked to your account.
            </p>
          </div>

          {/* HMRC not connected warning */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-600/20 bg-amber-50 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-amber-400" />
              <p className="text-sm text-amber-700">Not connected to HMRC — create an account to connect and submit</p>
            </div>
          </div>

          {/* Tax year bar */}
          <div className="mt-4 flex flex-wrap items-center gap-4 rounded-2xl border border-[#B8D0EB] bg-[#CCE0F5] px-4 py-3">
            <div className="flex items-center gap-2">
              <label className="text-xs text-[#2E4A63]">Tax year</label>
              <span className="rounded-xl border border-[#B8D0EB] bg-white px-3 py-1.5 text-sm text-[#0F1C2E]">{taxYear.label}</span>
            </div>
            <div className="h-4 w-px bg-[#B8D0EB]" />
            <p className="text-xs text-[#2E4A63]">{formatDate(taxYear.start)} – {formatDate(taxYear.end)}</p>
          </div>

          {/* Quarterly cards */}
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {quarters.map((q, i) => {
              const isActive = i === activeQuarterIndex;
              const hasData = isActive && hasFigures;

              return (
                <div
                  key={q.periodKey}
                  className={`rounded-2xl border p-4 ${
                    q.isFuture
                      ? "border-[#B8D0EB] bg-[#DEE9F8] opacity-50"
                      : hasData
                      ? "border-[#2E88D0]/30 bg-[#CCE0F5]"
                      : q.isPast
                      ? "border-amber-600/20 bg-amber-50"
                      : "border-[#B8D0EB] bg-[#DEE9F8]"
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#2E4A63]">{q.label}</p>
                    {hasData ? (
                      <span className="rounded-full border border-[#2E88D0]/20 bg-[#2E88D0]/10 px-2 py-0.5 text-[10px] text-[#2E88D0]">Ready to submit</span>
                    ) : q.isFuture ? null : (
                      <span className="rounded-full border border-amber-600/20 bg-amber-100 px-2 py-0.5 text-[10px] text-amber-700">Not submitted</span>
                    )}
                  </div>

                  {/* Dates */}
                  <p className="mt-2 text-[11px] text-[#2E4A63]">{formatDate(q.quarterStart)} – {formatDate(q.quarterEnd)}</p>
                  <p className="mt-0.5 text-[10px] text-[#2E4A63]">Due: {DEADLINES[i]}</p>

                  {/* Figures — only on active quarter */}
                  {hasData ? (
                    <div className="mt-3 space-y-1">
                      <p className="text-xs text-[#2E4A63]">Turnover: <span className="font-medium text-[#0F1C2E]">{formatCurrency(turnover!)}</span></p>
                      <p className="text-xs text-[#2E4A63]">Expenses: <span className="font-medium text-[#0F1C2E]">{formatCurrency(expenses!)}</span></p>
                      <p className="mt-1 text-[10px] text-[#2E4A63] italic">Cumulative year-to-date</p>
                    </div>
                  ) : null}

                  {/* Action */}
                  <div className="mt-3">
                    {hasData ? (
                      <button
                        type="button"
                        onClick={handleSignUp}
                        className="rounded-lg bg-[#2E88D0] px-3 py-1.5 text-xs font-medium text-white transition hover:opacity-90"
                      >
                        Sign up to submit →
                      </button>
                    ) : q.isFuture ? null : (
                      <p className="text-[10px] text-[#2E4A63]">Connect to HMRC to submit</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tax estimate */}
          {hasFigures && (
            <div className="mt-4">
              <TaxEstimate turnover={turnover!} expenses={expenses!} isQuarterly />
            </div>
          )}

          {/* Quarter assumption disclaimer */}
          <div className="mt-4 rounded-xl border border-[#B8D0EB] bg-[#DEE9F8] px-4 py-3">
            <p className="text-xs text-[#2E4A63]">
              Based on today&apos;s date, we&apos;ve placed your figures in the current quarter. Once you connect to HMRC, we&apos;ll check your actual open obligations and confirm the correct period.
            </p>
          </div>

          {/* Empty submission history */}
          <div className="mt-8">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-[#2E4A63]">Submission history</p>
            <div className="rounded-2xl border border-[#B8D0EB] bg-[#DEE9F8] px-6 py-8 text-center">
              <p className="text-sm text-[#2E4A63]">No submissions yet. Create an account and connect to HMRC to submit your first quarterly update.</p>
            </div>
          </div>

          {/* Year-end note */}
          <div className="mt-8 rounded-2xl border border-[#B8D0EB] bg-[#DEE9F8] px-6 py-5">
            <p className="text-sm font-medium text-[#0F1C2E]">Final Declaration (year-end)</p>
            <p className="mt-1 text-xs leading-5 text-[#2E4A63]">
              Flonancial handles quarterly updates only. For the year-end Final Declaration, use{" "}
              <a href="https://www.gov.uk/personal-tax-account" target="_blank" rel="noopener noreferrer" className="text-[#2E88D0] underline hover:no-underline">
                HMRC&apos;s online service
              </a>{" "}
              or another compatible product. The deadline is 31 January following the end of the tax year.
            </p>
          </div>

          {/* Bottom CTA */}
          <div className="mt-8 rounded-2xl border border-[#2E88D0]/30 bg-[#2E88D0]/10 px-8 py-8 text-center">
            <h2 className="text-lg font-semibold text-[#0F1C2E]">Ready to submit?</h2>
            <p className="mx-auto mt-2 max-w-[440px] text-sm leading-6 text-[#2E4A63]">
              Create your free account, connect to HMRC, and submit your quarterly update in under 2 minutes.
            </p>
            <button
              type="button"
              onClick={handleSignUp}
              className="mt-5 rounded-2xl bg-[#2E88D0] px-6 py-3 text-sm font-medium text-white transition hover:opacity-90"
            >
              Create your free account
            </button>
            <p className="mt-3 text-xs leading-5 text-[#2E4A63]">Free · No card required</p>
          </div>

        </section>
      </main>
    </>
  );
}
