"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteShell } from "@/components/site-shell";
import { SpreadsheetUpload, ExtractedFigures } from "@/components/spreadsheet-upload";
import { createClient } from "@/utils/supabase/client";
import { collectFraudData } from "@/utils/hmrc/collect-fraud-data";

// ─── Types ────────────────────────────────────────────────────────────────────

type Business = {
  id: number;
  name: string;
  business_type: string | null;
  accounting_year_end: string | null;
  hmrc_business_id: string | null;
};

type QuarterlySubmission = {
  id: number;
  period_key: string | null;
  quarter_start: string;
  quarter_end: string;
  turnover: number;
  expenses: number;
  other_income: number;
  status: "draft" | "submitted";
  submitted_at: string | null;
  hmrc_correlation_id: string | null;
};

type SubmissionHistoryRow = {
  id: number;
  period_key: string;
  quarter_start: string;
  quarter_end: string;
  turnover: number;
  expenses: number;
  other_income: number;
  tax_year: string;
  action: string;
  submitted_at: string;
  hmrc_correlation_id: string | null;
};

type HmrcObligation = {
  business_id: number;
  status: string | null;
  quarter_start: string | null;
  quarter_end: string | null;
  due_date: string | null;
};

type Quarter = {
  label: string;
  shortLabel: string;
  quarterStart: string;
  quarterEnd: string;
  periodKey: string;
  submission: QuarterlySubmission | null;
  isCurrent: boolean;
  isFuture: boolean;
  isPast: boolean;
};

type TaxYear = {
  label: string;
  start: string;
  end: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function encodeFraudDataHeader(): string {
  const data = collectFraudData();
  return btoa(JSON.stringify(data));
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

function formatDate(value: string) {
  return new Date(`${value}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function toInputDate(date: Date) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function makePeriodKey(start: string, end: string) {
  return `${start}_${end}`;
}

function getTaxYearForDate(dateStr: string, accountingYearEnd: string): TaxYear {
  const [endMonth, endDay] = accountingYearEnd.split("-").map(Number);
  const date = new Date(`${dateStr}T00:00:00Z`);
  const year = date.getUTCFullYear();

  let yearEnd = new Date(Date.UTC(year, endMonth - 1, endDay));
  if (yearEnd < date) yearEnd = new Date(Date.UTC(year + 1, endMonth - 1, endDay));

  const yearStart = new Date(yearEnd);
  yearStart.setUTCFullYear(yearStart.getUTCFullYear() - 1);
  yearStart.setUTCDate(yearStart.getUTCDate() + 1);

  const startYear = yearStart.getUTCFullYear();
  const endYear = yearEnd.getUTCFullYear();
  const label = startYear === endYear ? String(startYear) : `${startYear}–${String(endYear).slice(2)}`;
  return { label, start: toInputDate(yearStart), end: toInputDate(yearEnd) };
}

function getCurrentTaxYear(accountingYearEnd: string): TaxYear {
  return getTaxYearForDate(toInputDate(new Date()), accountingYearEnd);
}

function getQuartersForTaxYear(taxYear: TaxYear): Omit<Quarter, "submission">[] {
  const now = new Date();
  const cursor = new Date(`${taxYear.start}T00:00:00Z`);
  const quarters: Omit<Quarter, "submission">[] = [];

  for (let i = 0; i < 4; i++) {
    const periodStart = new Date(cursor);
    const periodEnd = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 3, cursor.getUTCDate() - 1));

    const quarterStart = toInputDate(periodStart);
    const quarterEnd = toInputDate(periodEnd);
    const isFuture = new Date(`${quarterStart}T00:00:00Z`) > now;
    const isPast = new Date(`${quarterEnd}T23:59:59Z`) < now;
    const isCurrent = !isFuture && !isPast;

    const shortLabel = `Q${i + 1}`;
    let label = shortLabel;
    if (isCurrent) label += " · CURRENT";

    quarters.push({ label, shortLabel, quarterStart, quarterEnd, periodKey: makePeriodKey(quarterStart, quarterEnd), isCurrent, isFuture, isPast });
    cursor.setUTCMonth(cursor.getUTCMonth() + 3);
  }

  return quarters;
}

function getAvailableYears(accountingYearEnd: string): TaxYear[] {
  const current = getCurrentTaxYear(accountingYearEnd);
  const prevStart = new Date(`${current.start}T00:00:00Z`);
  prevStart.setUTCFullYear(prevStart.getUTCFullYear() - 1);
  const prev = getTaxYearForDate(toInputDate(prevStart), accountingYearEnd);
  return [current, prev];
}

function getQuarterLabel(quarterStart: string, quarters: Quarter[]): string {
  const match = quarters.find((q) => q.quarterStart === quarterStart);
  return match?.shortLabel ?? "";
}

function isCoveredQuarter(submission: QuarterlySubmission | null): boolean {
  if (!submission) return false;
  return submission.turnover === 0 && submission.expenses === 0 && submission.other_income === 0;
}

// ─── HMRC held data display ───────────────────────────────────────────────────

function HmrcHeldSummary({ data, businessType }: { data: unknown; businessType: string | null }) {
  const d = data as Record<string, unknown>;

  let periodStart: string | null = null;
  let periodEnd: string | null = null;
  let turnover: number | null = null;
  let expenses: number | null = null;
  let submittedOn: string | null = null;

  try {
    submittedOn = typeof d.submittedOn === "string" ? d.submittedOn : null;

    if (businessType === "uk_property") {
      periodStart = typeof d.fromDate === "string" ? d.fromDate : null;
      periodEnd = typeof d.toDate === "string" ? d.toDate : null;
      const ukProp = d.ukProperty as Record<string, unknown> | undefined;
      const income = ukProp?.income as Record<string, number> | undefined;
      const exp = ukProp?.expenses as Record<string, number> | undefined;
      turnover = income?.periodAmount ?? null;
      expenses = exp?.consolidatedExpenses ?? null;
    } else {
      const dates = d.periodDates as Record<string, string> | undefined;
      periodStart = dates?.periodStartDate ?? null;
      periodEnd = dates?.periodEndDate ?? null;
      const income = d.periodIncome as Record<string, number> | undefined;
      const exp = d.periodExpenses as Record<string, number> | undefined;
      turnover = income?.turnover ?? null;
      expenses = exp?.consolidatedExpenses ?? null;
    }
  } catch {
    return <p className="mt-3 text-xs text-[#2E4A63]">Unable to read the data from HMRC.</p>;
  }

  if (!periodStart && !periodEnd && turnover === null && expenses === null) {
    return <p className="mt-3 text-xs text-[#2E4A63]">No data held by HMRC for this tax year.</p>;
  }

  return (
    <div className="mt-3 space-y-2">
      {periodStart && periodEnd ? (
        <div className="flex justify-between rounded-xl border border-[#B8D0EB] bg-white px-4 py-3">
          <p className="text-xs text-[#2E4A63]">Period</p>
          <p className="text-xs font-medium text-[#0F1C2E]">{formatDate(periodStart)} – {formatDate(periodEnd)}</p>
        </div>
      ) : null}
      {turnover !== null ? (
        <div className="flex justify-between rounded-xl border border-[#B8D0EB] bg-white px-4 py-3">
          <p className="text-xs text-[#2E4A63]">Turnover</p>
          <p className="text-xs font-medium text-[#0F1C2E]">{formatCurrency(turnover)}</p>
        </div>
      ) : null}
      {expenses !== null ? (
        <div className="flex justify-between rounded-xl border border-[#B8D0EB] bg-white px-4 py-3">
          <p className="text-xs text-[#2E4A63]">Expenses</p>
          <p className="text-xs font-medium text-[#0F1C2E]">{formatCurrency(expenses)}</p>
        </div>
      ) : null}
      {submittedOn ? (
        <p className="text-[10px] text-[#2E4A63]">Last updated: {formatDateTime(submittedOn)}</p>
      ) : null}
      <p className="text-[10px] text-[#2E4A63]">This is what HMRC holds based on your most recent cumulative submission.</p>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function BusinessPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const businessId = Number(params.id);

  const [business, setBusiness] = useState<Business | null>(null);
  const [submissions, setSubmissions] = useState<QuarterlySubmission[]>([]);
  const [obligations, setObligations] = useState<HmrcObligation[]>([]);
  const [loadingObligations, setLoadingObligations] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [selectedYearLabel, setSelectedYearLabel] = useState<string | null>(null);
  const [uploadingQuarter, setUploadingQuarter] = useState<string | null>(null);
  const [history, setHistory] = useState<SubmissionHistoryRow[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [hmrcHeldData, setHmrcHeldData] = useState<unknown>(null);
  const [loadingHmrcData, setLoadingHmrcData] = useState(false);
  const [hmrcNeedsReconnect, setHmrcNeedsReconnect] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showHmrcData, setShowHmrcData] = useState(false);

  const loadData = useCallback(async () => {
    if (!Number.isFinite(businessId)) { setNotFound(true); setLoading(false); return; }
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) { router.replace("/login"); return; }

    const { data: businessData, error: businessError } = await supabase
      .from("businesses").select("id, name, business_type, accounting_year_end, hmrc_business_id")
      .eq("id", businessId).eq("user_id", user.id).single();
    if (businessError || !businessData) { setNotFound(true); setLoading(false); return; }

    const { data: subData } = await supabase.from("quarterly_updates")
      .select("id, period_key, quarter_start, quarter_end, turnover, expenses, other_income, status, submitted_at, hmrc_correlation_id")
      .eq("business_id", businessId).eq("user_id", user.id).order("quarter_start", { ascending: true });

    setBusiness(businessData);
    setSubmissions((subData ?? []) as QuarterlySubmission[]);

    const { data: historyData } = await supabase.from("submission_history")
      .select("id, period_key, quarter_start, quarter_end, turnover, expenses, other_income, tax_year, action, submitted_at, hmrc_correlation_id")
      .eq("business_id", businessId).eq("user_id", user.id)
      .order("submitted_at", { ascending: false });
    setHistory((historyData ?? []) as SubmissionHistoryRow[]);
    setLoading(false);
  }, [businessId, supabase, router]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (!successMessage) return;
    const timer = setTimeout(() => setSuccessMessage(null), 10000);
    return () => clearTimeout(timer);
  }, [successMessage]);

  const fetchObligations = useCallback(async (taxYear: TaxYear) => {
    if (!business?.hmrc_business_id) return;
    setLoadingObligations(true);
    try {
      const response = await fetch(
        `/api/hmrc/obligations?businessId=${businessId}&fromDate=${taxYear.start}&toDate=${taxYear.end}`,
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
          headers: { "X-Fraud-Data": encodeFraudDataHeader() },
        }
      );
      if (!response.ok) {
        if (response.status === 401) setHmrcNeedsReconnect(true);
        setObligations([]); return;
      }
      const data = await response.json();
      setObligations(data.obligations ?? []);
    } catch { setObligations([]); }
    finally { setLoadingObligations(false); }
  }, [business?.hmrc_business_id, businessId]);

  const fetchHmrcHeldData = useCallback(async () => {
    if (!business?.hmrc_business_id || !selectedYear) return;
    setLoadingHmrcData(true);
    try {
      const taxYear = selectedYear.label.replace("–", "-");
      const response = await fetch(
        `/api/hmrc/retrieve-cumulative?businessId=${businessId}&taxYear=${taxYear}`,
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
          headers: { "X-Fraud-Data": encodeFraudDataHeader() },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setHmrcHeldData(data.hmrcData);
      } else {
        if (response.status === 401) setHmrcNeedsReconnect(true);
        setHmrcHeldData(null);
      }
    } catch { setHmrcHeldData(null); }
    finally { setLoadingHmrcData(false); }
  }, [business?.hmrc_business_id, businessId]);

  const availableYears = useMemo(() => {
    if (!business?.accounting_year_end) return [];
    return getAvailableYears(business.accounting_year_end);
  }, [business]);

  const selectedYear = useMemo(() => {
    if (availableYears.length === 0) return null;
    if (selectedYearLabel) return availableYears.find((y) => y.label === selectedYearLabel) ?? availableYears[0];
    return availableYears[0];
  }, [availableYears, selectedYearLabel]);

  useEffect(() => {
    if (selectedYear && business?.hmrc_business_id) fetchObligations(selectedYear);
  }, [selectedYear, business?.hmrc_business_id, fetchObligations]);

  const quarters: Quarter[] = useMemo(() => {
    if (!selectedYear || !business?.accounting_year_end) return [];
    return getQuartersForTaxYear(selectedYear).map((q) => {
      const submission = submissions.find((s) => s.quarter_start === q.quarterStart && s.quarter_end === q.quarterEnd) ?? null;
      return { ...q, submission };
    });
  }, [selectedYear, business, submissions]);

  const latestSubmittedPeriodKey = useMemo(() => {
    const submitted = quarters.filter((q) => q.submission?.status === "submitted").sort((a, b) => b.quarterEnd.localeCompare(a.quarterEnd));
    return submitted[0]?.periodKey ?? null;
  }, [quarters]);

  function getDueDate(quarterStart: string, quarterEnd: string): string | null {
    const ob = obligations.find((o) => {
      if (!o.quarter_start || !o.quarter_end) return false;
      return quarterStart >= o.quarter_start && quarterEnd <= o.quarter_end;
    });
    return ob?.due_date ?? null;
  }

  async function handleSubmit(figures: ExtractedFigures) {
    if (!uploadingQuarter || !business) return;
    const quarter = quarters.find((q) => q.periodKey === uploadingQuarter);
    if (!quarter) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      const response = await fetch("/api/hmrc/submit-quarterly", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId,
          quarterStart: quarter.quarterStart,
          quarterEnd: quarter.quarterEnd,
          periodKey: quarter.periodKey,
          turnover: figures.turnover,
          expenses: figures.expenses,
          otherIncome: figures.otherIncome,
          fraudData: collectFraudData(),
        }),
      });

      if (!response.ok) {
        if (response.status === 401) { setHmrcNeedsReconnect(true); throw new Error("Your HMRC connection has expired. Please reconnect to HMRC."); }
        const err = await response.json().catch(() => ({}));
        let errorMsg = err.message ?? err.error ?? "HMRC submission failed";
        if (/not authorised|CLIENT_OR_AGENT_NOT_AUTHORISED/i.test(errorMsg)) {
          errorMsg += " — check that the National Insurance number in your Settings matches the HMRC account you connected with.";
        }
        throw new Error(errorMsg);
      }

      const result = await response.json();

      setUploadingQuarter(null);
      setSuccessMessage(
        `Submitted to HMRC for ${business.name} (${quarter.shortLabel}): Turnover ${formatCurrency(figures.turnover)}, Expenses ${formatCurrency(figures.expenses)}. Confirmation ID: ${result.correlationId ?? "pending"}`
      );
      await loadData();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Submission failed — please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <SiteShell>
        <section className="mx-auto w-full max-w-[1000px] px-6 py-10 sm:px-8 lg:px-10">
          <p className="text-sm text-[#2E4A63]">Loading...</p>
        </section>
      </SiteShell>
    );
  }

  if (notFound || !business) {
    return (
      <SiteShell>
        <section className="mx-auto w-full max-w-[1000px] px-6 py-10 sm:px-8 lg:px-10">
          <p className="text-sm text-[#2E4A63]">Business not found.</p>
          <Link href="/dashboard" className="mt-4 block text-sm text-[#2E88D0] hover:opacity-75">Back to dashboard</Link>
        </section>
      </SiteShell>
    );
  }

  const isHmrcReady = Boolean(business.hmrc_business_id);

  return (
    <>
      <SiteHeader
        businessEmoji=""
        businessName={business.name}
        businessTagline=""
        businessType={business.business_type ?? ""}
        hmrcReady={isHmrcReady}
        editBusinessHref={`/edit-business/${business.id}`}
      />
      <main className="min-h-screen">
        <section className="mx-auto w-full max-w-[1000px] px-6 py-6 sm:px-8 lg:px-10">

          {hmrcNeedsReconnect ? (
            <div className="mb-4 flex items-start gap-3 rounded-2xl border border-amber-600/20 bg-amber-50 px-5 py-4">
              <span className="mt-0.5 shrink-0 text-amber-600">⚠</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-amber-700">Your HMRC connection has expired</p>
                <p className="mt-0.5 text-xs text-amber-600">Please reconnect to HMRC to view obligations and submit updates.</p>
              </div>
              <a href="/api/hmrc/start" className="shrink-0 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-amber-700">Reconnect</a>
            </div>
          ) : null}

          {submitError ? (
            <div className="mb-4 flex items-start gap-3 rounded-2xl border border-red-600/20 bg-red-50 px-5 py-4">
              <span className="mt-0.5 shrink-0 text-red-600">✗</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-red-700">Submission failed</p>
                <p className="mt-0.5 text-xs text-red-600">{submitError}</p>
              </div>
              <button type="button" onClick={() => setSubmitError(null)} className="shrink-0 text-xs text-red-600 hover:text-red-800">Dismiss</button>
            </div>
          ) : null}

          {successMessage ? (
            <div className="mb-4 flex items-start gap-3 rounded-2xl border border-emerald-600/20 bg-emerald-50 px-5 py-4">
              <span className="mt-0.5 shrink-0 text-emerald-600">✓</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-emerald-700">Quarterly update submitted</p>
                <p className="mt-0.5 text-xs text-emerald-600">{successMessage}</p>
              </div>
              <button type="button" onClick={() => setSuccessMessage(null)} className="shrink-0 text-xs text-emerald-600 hover:text-emerald-800">Dismiss</button>
            </div>
          ) : null}

          {availableYears.length > 0 && selectedYear ? (
            <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-[#B8D0EB] bg-[#CCE0F5] px-4 py-3">
              <div className="flex items-center gap-2">
                <label className="text-xs text-[#2E4A63]">Tax year</label>
                <select
                  value={selectedYear.label}
                  onChange={(e) => { setSelectedYearLabel(e.target.value); setUploadingQuarter(null); setShowHmrcData(false); }}
                  className="rounded-xl border border-[#B8D0EB] bg-white px-3 py-1.5 text-sm text-[#0F1C2E] outline-none transition focus:border-[#2E88D0]"
                >
                  {availableYears.map((y) => <option key={y.label} value={y.label}>{y.label}</option>)}
                </select>
              </div>
              <div className="h-4 w-px bg-[#B8D0EB]" />
              <p className="text-xs text-[#2E4A63]">{formatDate(selectedYear.start)} – {formatDate(selectedYear.end)}</p>
              {isHmrcReady && loadingObligations ? <span className="ml-auto text-xs text-[#2E4A63]">Checking HMRC...</span> : null}
              {!isHmrcReady ? (
                <span className="ml-auto text-xs text-amber-700">
                  <Link href={`/edit-business/${business.id}`} className="underline hover:no-underline">Connect to HMRC</Link> to submit
                </span>
              ) : null}
            </div>
          ) : null}

          {quarters.length > 0 ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {quarters.map((q) => {
                const isSubmitted = q.submission?.status === "submitted";
                const isLatestSubmitted = q.periodKey === latestSubmittedPeriodKey;
                const isCovered = isCoveredQuarter(q.submission);
                const canSubmit = !q.isFuture && isHmrcReady;

                return (
                  <div
                    key={q.periodKey}
                    className={`rounded-2xl border p-4 ${
                      q.isFuture ? "border-[#B8D0EB] bg-[#DEE9F8] opacity-50" :
                      isSubmitted ? "border-emerald-600/20 bg-emerald-50" :
                      q.isCurrent ? "border-[#2E88D0]/30 bg-[#CCE0F5]" :
                      "border-amber-600/20 bg-amber-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#2E4A63]">{q.label}</p>
                      {isSubmitted ? (
                        <span className="rounded-full border border-emerald-600/20 bg-emerald-100 px-2 py-0.5 text-[10px] text-emerald-700">
                          {isCovered ? "Covered" : "Submitted"}
                        </span>
                      ) : q.isFuture ? null : (
                        <span className="rounded-full border border-amber-600/20 bg-amber-100 px-2 py-0.5 text-[10px] text-amber-700">Not submitted</span>
                      )}
                    </div>

                    <p className="mt-2 text-[11px] text-[#2E4A63]">{formatDate(q.quarterStart)} – {formatDate(q.quarterEnd)}</p>
                    {getDueDate(q.quarterStart, q.quarterEnd) ? <p className="mt-0.5 text-[10px] text-[#2E4A63]">Due: {formatDate(getDueDate(q.quarterStart, q.quarterEnd)!)}</p> : null}

                    {isSubmitted && q.submission ? (
                      <div className="mt-3 space-y-1">
                        {isCovered ? (
                          <p className="text-xs text-[#2E4A63]">Covered by your cumulative submission for a later quarter.</p>
                        ) : (
                          <>
                            <p className="text-xs text-[#2E4A63]">Turnover (YTD): <span className="font-medium text-[#0F1C2E]">{formatCurrency(q.submission.turnover)}</span></p>
                            <p className="text-xs text-[#2E4A63]">Expenses (YTD): <span className="font-medium text-[#0F1C2E]">{formatCurrency(q.submission.expenses)}</span></p>
                            {q.submission.other_income > 0 ? (
                              <p className="text-xs text-[#2E4A63]">Other income (YTD): <span className="font-medium text-[#0F1C2E]">{formatCurrency(q.submission.other_income)}</span></p>
                            ) : null}
                            <p className="mt-1 text-[10px] text-[#2E4A63]">Submitted {formatDateTime(q.submission.submitted_at!)}</p>
                          </>
                        )}
                      </div>
                    ) : null}

                    {!q.isFuture ? (
                      <div className="mt-3">
                        {isSubmitted && isLatestSubmitted && !isCovered ? (
                          <button type="button" onClick={() => setUploadingQuarter(q.periodKey)} className="text-xs text-[#2E4A63] transition hover:text-[#0F1C2E]">Amend →</button>
                        ) : isSubmitted && !isLatestSubmitted && !isCovered ? (
                          <p className="text-[10px] text-[#2E4A63]">To update, amend your latest submitted quarter</p>
                        ) : !isSubmitted && canSubmit ? (
                          <button type="button" onClick={() => { setUploadingQuarter(q.periodKey); setSuccessMessage(null); }} className="rounded-lg bg-[#2E88D0] px-3 py-1.5 text-xs font-medium text-white transition hover:opacity-90">Upload & Submit</button>
                        ) : !isHmrcReady ? (
                          <p className="text-[10px] text-[#2E4A63]">Connect to HMRC first</p>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : null}

          {uploadingQuarter ? (
            <div className="mt-6">
              <SpreadsheetUpload
                quarterLabel={quarters.find((q) => q.periodKey === uploadingQuarter)?.shortLabel ?? ""}
                onSubmit={handleSubmit}
                onCancel={() => setUploadingQuarter(null)}
                submitting={submitting}
              />
            </div>
          ) : null}

          {isHmrcReady && selectedYear && !uploadingQuarter ? (
            <div className="mt-6">
              {!showHmrcData ? (
                <button type="button" onClick={() => { setShowHmrcData(true); fetchHmrcHeldData(); }} className="text-xs text-[#2E4A63] transition hover:text-[#0F1C2E]">View what HMRC currently holds for this tax year →</button>
              ) : (
                <div className="rounded-2xl border border-[#B8D0EB] bg-[#DEE9F8] p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-[#0F1C2E]">What HMRC holds for {selectedYear.label}</p>
                    <button type="button" onClick={() => setShowHmrcData(false)} className="text-xs text-[#2E4A63] hover:text-[#0F1C2E]">Hide</button>
                  </div>
                  {loadingHmrcData ? (
                    <p className="mt-3 text-xs text-[#2E4A63]">Loading from HMRC...</p>
                  ) : hmrcHeldData ? (
                    <HmrcHeldSummary data={hmrcHeldData} businessType={business.business_type} />
                  ) : (
                    <p className="mt-3 text-xs text-[#2E4A63]">No data held by HMRC for this tax year, or unable to retrieve.</p>
                  )}
                </div>
              )}
            </div>
          ) : null}

{history.length === 0 ? (
            <div className="mt-8">
              <p className="mb-3 text-xs font-medium uppercase tracking-wide text-[#2E4A63]">Submission history</p>
              <div className="rounded-2xl border border-[#B8D0EB] bg-[#DEE9F8] px-6 py-6 text-center">
                <p className="text-sm text-[#2E4A63]">No submissions yet.</p>
                <p className="mt-2 text-xs text-[#2E4A63]/60">If you uploaded a spreadsheet before signing up, those figures were for preview only and were not stored. Please upload your spreadsheet again above to submit to HMRC — this ensures your data is authenticated and securely linked to your account.</p>
              </div>
            </div>
          ) : null}

          {history.length > 0 ? (
            <div className="mt-8">
              <p className="mb-3 text-xs font-medium uppercase tracking-wide text-[#2E4A63]">Submission history</p>
              <div className="overflow-hidden rounded-2xl border border-[#B8D0EB]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#CCE0F5] text-[#2E4A63] text-xs uppercase tracking-wide">
                      <th scope="col" className="px-4 py-3 text-left font-semibold">Quarter</th>
                      <th scope="col" className="px-4 py-3 text-left font-semibold">Period</th>
                      <th scope="col" className="px-4 py-3 text-left font-semibold">Submitted</th>
                      <th scope="col" className="px-4 py-3 text-right font-semibold">Turnover</th>
                      <th scope="col" className="px-4 py-3 text-right font-semibold">Expenses</th>
                      <th scope="col" className="px-4 py-3 text-left font-semibold">Action</th>
                      <th scope="col" className="px-4 py-3 text-left font-semibold">HMRC Ref</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((s, i) => (
                      <tr key={s.id} className={i % 2 === 0 ? "bg-white" : "bg-[#f4f8fd]"}>
                        <td className="px-4 py-3 text-xs font-medium text-[#0F1C2E]">{getQuarterLabel(s.quarter_start, quarters)}</td>
                        <td className="px-4 py-3 text-xs text-[#0F1C2E]">{formatDate(s.quarter_start)} – {formatDate(s.quarter_end)}</td>
                        <td className="px-4 py-3 text-xs text-[#2E4A63] whitespace-nowrap">{s.submitted_at ? formatDateTime(s.submitted_at) : "—"}</td>
                        <td className="px-4 py-3 text-right text-xs font-medium text-[#0F1C2E]">{formatCurrency(s.turnover)}</td>
                        <td className="px-4 py-3 text-right text-xs font-medium text-[#0F1C2E]">{formatCurrency(s.expenses)}</td>
                        <td className="px-4 py-3 text-xs text-[#2E4A63]">{s.action === "amended" ? "Amended" : s.action === "covered" ? "Covered" : "Submitted"}</td>
                        <td className="px-4 py-3 text-xs text-[#2E4A63] font-mono">{s.hmrc_correlation_id ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          {selectedYear ? (
            <div className="mt-8 rounded-2xl border border-[#B8D0EB] bg-[#DEE9F8] px-6 py-5">
              <p className="text-sm font-medium text-[#0F1C2E]">Final Declaration (year-end)</p>
              <p className="mt-1 text-xs leading-5 text-[#2E4A63]">
                Flonancial handles quarterly updates only. For the year-end Final Declaration, use{" "}
                <a href="https://www.gov.uk/personal-tax-account" target="_blank" rel="noopener noreferrer" className="text-[#2E88D0] underline hover:no-underline">HMRC's online service</a>{" "}
                or another compatible product. The deadline is 31 January following the end of the tax year.
              </p>
            </div>
          ) : null}

        </section>
      </main>
    </>
  );
}
