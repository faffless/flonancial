"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SiteShell } from "@/components/site-shell";
import { createClient } from "@/utils/supabase/client";

type Business = {
  id: number;
  name: string;
  trading_name: string | null;
  business_type: string | null;
  start_date: string | null;
  accounting_year_end: string | null;
  hmrc_business_id: string | null;
};

type ExistingUpdate = {
  id: number;
  business_id: number;
  period_key: string | null;
  quarter_start: string;
  quarter_end: string;
  status: string | null;
};

type PeriodOption = {
  key: string;
  quarterStart: string;
  quarterEnd: string;
  label: string;
  source: "hmrc" | "local";
  status?: string | null;
  dueDate?: string | null;
};

type HmrcObligation = {
  business_id: number;
  business_name: string;
  hmrc_business_id: string;
  type_of_business: string;
  period_key: string | null;
  status: string | null;
  quarter_start: string | null;
  quarter_end: string | null;
  due_date: string | null;
  received_date: string | null;
};

type HmrcObligationsResponse = {
  obligations?: HmrcObligation[];
  error?: string;
  status?: number;
};

function formatCurrencyPreview(value: string) {
  if (value === "") return "£0.00";
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return "£0.00";
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(parsed);
}

function toInputDate(date: Date) { return date.toISOString().slice(0, 10); }

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function formatBusinessType(value: string | null) {
  if (!value) return "Not set";
  if (value === "sole_trader") return "Sole trader";
  if (value === "uk_property") return "UK property";
  return value;
}

function formatAccountingYearEnd(value: string | null) {
  if (!value) return "Not set";
  if (value === "04-05") return "5 April";
  if (value === "03-31") return "31 March";
  if (value === "12-31") return "31 December";
  return value;
}

function makePeriodKey(quarterStart: string, quarterEnd: string) { return `${quarterStart}_${quarterEnd}`; }

function generatePeriodsFromYearEnd(startDate: string, accountingYearEnd: string, count = 8): PeriodOption[] {
  const [endMonth, endDay] = accountingYearEnd.split("-").map(Number);
  const probe = new Date(2000, endMonth - 1, endDay + 1);
  const periodStartMonth = probe.getMonth() + 1;
  const periodStartDay = probe.getDate();
  const businessStart = new Date(`${startDate}T00:00:00`);
  let yearStart = new Date(businessStart.getFullYear(), periodStartMonth - 1, periodStartDay);
  if (yearStart > businessStart) yearStart.setFullYear(yearStart.getFullYear() - 1);
  const periods: PeriodOption[] = [];
  const cursor = new Date(yearStart);
  for (let i = 0; i < count + 12; i++) {
    const periodStart = new Date(cursor);
    const periodEnd = new Date(cursor);
    periodEnd.setMonth(periodEnd.getMonth() + 3);
    periodEnd.setDate(periodEnd.getDate() - 1);
    const quarterStart = toInputDate(periodStart);
    const quarterEnd = toInputDate(periodEnd);
    if (periodStart >= businessStart) {
      periods.push({ key: makePeriodKey(quarterStart, quarterEnd), quarterStart, quarterEnd, label: `${formatDate(quarterStart)} to ${formatDate(quarterEnd)}`, source: "local" });
      if (periods.length >= count) break;
    }
    cursor.setMonth(cursor.getMonth() + 3);
  }
  return periods;
}

function generatePeriodsFallback(startDate: string, count = 8): PeriodOption[] {
  const periods: PeriodOption[] = [];
  const cursor = new Date(`${startDate}T00:00:00`);
  for (let i = 0; i < count; i++) {
    const periodStart = new Date(cursor);
    const periodEnd = new Date(cursor);
    periodEnd.setMonth(periodEnd.getMonth() + 3);
    periodEnd.setDate(periodEnd.getDate() - 1);
    const quarterStart = toInputDate(periodStart);
    const quarterEnd = toInputDate(periodEnd);
    periods.push({ key: makePeriodKey(quarterStart, quarterEnd), quarterStart, quarterEnd, label: `${formatDate(quarterStart)} to ${formatDate(quarterEnd)}`, source: "local" });
    cursor.setMonth(cursor.getMonth() + 3);
  }
  return periods;
}

function generateLocalPeriods(startDate: string, accountingYearEnd: string | null): PeriodOption[] {
  if (accountingYearEnd && accountingYearEnd !== "other") return generatePeriodsFromYearEnd(startDate, accountingYearEnd);
  return generatePeriodsFallback(startDate);
}

function AddUpdateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedBusinessId = searchParams.get("businessId");
  const supabase = useMemo(() => createClient(), []);

  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [existingUpdates, setExistingUpdates] = useState<ExistingUpdate[]>([]);
  const [hmrcObligations, setHmrcObligations] = useState<HmrcObligation[]>([]);
  const [businessId, setBusinessId] = useState("");
  const [periodKey, setPeriodKey] = useState("");
  const [turnover, setTurnover] = useState("");
  const [expenses, setExpenses] = useState("");
  const [message, setMessage] = useState("");
  const [loadingBusinesses, setLoadingBusinesses] = useState(true);
  const [loadingHmrc, setLoadingHmrc] = useState(false);
  const [saving, setSaving] = useState(false);

  const selectedBusiness = businesses.find((b) => String(b.id) === businessId) ?? null;
  const localPeriods = selectedBusiness?.start_date ? generateLocalPeriods(selectedBusiness.start_date, selectedBusiness.accounting_year_end) : [];
  const hmrcPeriods: PeriodOption[] = hmrcObligations
    .filter((item) => item.business_id === Number(businessId) && (item.status === "open" || item.status === "O") && item.quarter_start && item.quarter_end)
    .map((item) => ({
      key: item.period_key || makePeriodKey(item.quarter_start as string, item.quarter_end as string),
      quarterStart: item.quarter_start as string,
      quarterEnd: item.quarter_end as string,
      label: `${formatDate(item.quarter_start as string)} to ${formatDate(item.quarter_end as string)}`,
      source: "hmrc",
      status: item.status,
      dueDate: item.due_date,
    }));

  const generatedPeriods = selectedBusiness?.hmrc_business_id ? hmrcPeriods : localPeriods;
  const existingDraftPeriodKeys = new Set(
    existingUpdates.filter((u) => String(u.business_id) === businessId && u.status === "draft")
      .map((u) => u.period_key || makePeriodKey(u.quarter_start, u.quarter_end))
  );
  const availablePeriods = generatedPeriods.filter((p) => !existingDraftPeriodKeys.has(p.key));
  const selectedPeriod = availablePeriods.find((p) => p.key === periodKey) ?? null;

  // Whether the business was preselected via URL and is valid
  const isBusinessPreselected = !!(preselectedBusinessId && businesses.some((b) => String(b.id) === preselectedBusinessId));

  useEffect(() => {
    async function loadBusinesses() {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) { router.replace("/login"); return; }

      const { data: businessesData, error: businessesError } = await supabase
        .from("businesses").select("id, name, trading_name, business_type, start_date, accounting_year_end, hmrc_business_id")
        .eq("user_id", user.id).order("created_at", { ascending: true });

      if (businessesError) { setMessage(businessesError.message); setLoadingBusinesses(false); return; }

      const { data: updatesData, error: updatesError } = await supabase
        .from("quarterly_updates").select("id, business_id, period_key, quarter_start, quarter_end, status").eq("user_id", user.id);

      if (updatesError) { setMessage(updatesError.message); setLoadingBusinesses(false); return; }

      const loadedBusinesses = businessesData ?? [];
      setBusinesses(loadedBusinesses);
      setExistingUpdates(updatesData ?? []);

      if (preselectedBusinessId && loadedBusinesses.some((b) => String(b.id) === preselectedBusinessId)) {
        setBusinessId(preselectedBusinessId);
      } else if (loadedBusinesses.length > 0) {
        setBusinessId(String(loadedBusinesses[0].id));
      }

      setLoadingBusinesses(false);
    }
    loadBusinesses();
  }, [router, supabase, preselectedBusinessId]);

  useEffect(() => {
    async function loadHmrcObligations() {
      if (!selectedBusiness?.hmrc_business_id) { setHmrcObligations([]); return; }
      setLoadingHmrc(true);
      const response = await fetch("/api/hmrc/obligations", { method: "GET", credentials: "include", cache: "no-store" });
      const data = (await response.json()) as HmrcObligationsResponse;
      if (!response.ok) { setMessage(data.error || "Could not load HMRC obligations."); setHmrcObligations([]); setLoadingHmrc(false); return; }
      setHmrcObligations(data.obligations ?? []);
      setLoadingHmrc(false);
    }
    loadHmrcObligations();
  }, [selectedBusiness?.hmrc_business_id]);

  useEffect(() => {
    if (availablePeriods.length === 0) { setPeriodKey(""); return; }
    const selectedStillValid = availablePeriods.some((p) => p.key === periodKey);
    if (!selectedStillValid) setPeriodKey(availablePeriods[0].key);
  }, [businessId, periodKey, availablePeriods]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!businessId) { setMessage("Add a business first"); return; }
    if (!selectedBusiness) { setMessage("Select a business"); return; }
    if (!selectedBusiness.start_date) { setMessage("Add a business start date first"); return; }
    if (!selectedPeriod) { setMessage("Select an available period"); return; }
    if (turnover === "" || expenses === "") { setMessage("Enter turnover and expenses"); return; }

    const turnoverNumber = Number(turnover);
    const expensesNumber = Number(expenses);
    if (!Number.isFinite(turnoverNumber) || turnoverNumber < 0) { setMessage("Enter a valid turnover amount"); return; }
    if (!Number.isFinite(expensesNumber) || expensesNumber < 0) { setMessage("Enter a valid expenses amount"); return; }

    setSaving(true);
    setMessage("Saving...");

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) { setMessage("You need to log in"); setSaving(false); router.push("/login"); return; }

    const { data: existingDraft, error: existingError } = await supabase
      .from("quarterly_updates").select("id").eq("user_id", user.id).eq("business_id", Number(businessId))
      .eq("period_key", selectedPeriod.key).eq("status", "draft").maybeSingle();

    if (existingError) { setMessage(existingError.message); setSaving(false); return; }
    if (existingDraft) { setMessage("You already have a draft update for that period"); setSaving(false); return; }

    const { error } = await supabase.from("quarterly_updates").insert({
      business_id: Number(businessId),
      user_id: user.id,
      period_key: selectedPeriod.key,
      quarter_start: selectedPeriod.quarterStart,
      quarter_end: selectedPeriod.quarterEnd,
      turnover: turnoverNumber,
      expenses: expensesNumber,
      status: "draft",
    });

    if (error) { setMessage(error.message); setSaving(false); return; }
    router.push("/dashboard");
  }

  return (
    <SiteShell>
      <section className="mx-auto w-full max-w-[1000px] px-6 py-10 sm:px-8 lg:px-10">
        <div className="rounded-2xl border border-[#B8D0EB] bg-[#CCE0F5] p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-normal tracking-tight text-[#0F1C2E]">Add quarterly update</h1>
              <p className="mt-3 text-sm leading-6 text-[#2E4A63]">
                {isBusinessPreselected
                  ? `Adding a quarterly update for ${selectedBusiness?.name ?? "your business"}.`
                  : "Record the next available period for one of your saved businesses."}
              </p>
            </div>
            <Link href="/dashboard" className="text-sm text-[#2E4A63] underline underline-offset-4 transition hover:text-[#0F1C2E]">Back to dashboard</Link>
          </div>

          {loadingBusinesses ? (
            <p className="mt-6 text-sm text-[#2E4A63]">Loading businesses...</p>
          ) : businesses.length === 0 ? (
            <div className="mt-6 rounded-xl border border-[#B8D0EB] bg-[#DEE9F8] p-4">
              <p className="text-sm text-[#0F1C2E]">You need at least one business before you can add a quarterly update.</p>
              <div className="mt-4">
                <Link href="/add-business" className="rounded-xl bg-[#2E88D0] px-4 py-2.5 text-sm text-white transition hover:opacity-90">Add business</Link>
              </div>
            </div>
          ) : (
            <>
              <div className="mt-6 grid gap-4 sm:grid-cols-4">
                {[
                  { label: "Business", value: selectedBusiness?.name ?? "Select a business" },
                  { label: "Business type", value: formatBusinessType(selectedBusiness?.business_type ?? null) },
                  { label: "Year end", value: formatAccountingYearEnd(selectedBusiness?.accounting_year_end ?? null) },
                  { label: "Turnover preview", value: formatCurrencyPreview(turnover) },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-xl border border-[#B8D0EB] bg-[#DEE9F8] p-4">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-[#2E4A63]">{label}</p>
                    <p className="mt-2 text-sm text-[#0F1C2E]">{value}</p>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="mt-6 max-w-xl space-y-4">

                {/* Only show business selector if no business was preselected via URL */}
                {!isBusinessPreselected && (
                  <div>
                    <label htmlFor="business" className="mb-2 block text-sm text-[#0F1C2E]">Business</label>
                    <select id="business" value={businessId} onChange={(e) => { setBusinessId(e.target.value); setMessage(""); }}
                      className="w-full rounded-xl border border-[#B8D0EB] bg-white px-4 py-3 text-[#0F1C2E] outline-none transition focus:border-[#2E88D0]">
                      {businesses.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                )}

                <div>
                  <label htmlFor="period" className="mb-2 block text-sm text-[#0F1C2E]">Available period</label>
                  <select id="period" value={periodKey} onChange={(e) => setPeriodKey(e.target.value)}
                    disabled={!selectedBusiness?.start_date || availablePeriods.length === 0 || loadingHmrc}
                    className="w-full rounded-xl border border-[#B8D0EB] bg-white px-4 py-3 text-[#0F1C2E] outline-none transition focus:border-[#2E88D0] disabled:opacity-60">
                    {loadingHmrc ? (
                      <option value="">Loading HMRC periods...</option>
                    ) : availablePeriods.length > 0 ? (
                      availablePeriods.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)
                    ) : (
                      <option value="">{selectedBusiness?.hmrc_business_id ? "No open HMRC periods available" : "No available periods"}</option>
                    )}
                  </select>
                  {selectedBusiness?.hmrc_business_id ? (
                    <p className="mt-2 text-xs text-emerald-700">This business is HMRC linked. Only open HMRC obligation periods are shown.</p>
                  ) : !selectedBusiness?.accounting_year_end && selectedBusiness?.start_date ? (
                    <p className="mt-2 text-xs text-amber-700">No accounting year end set — periods are estimated from start date.</p>
                  ) : null}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    { label: "Quarter start", value: selectedPeriod ? formatDate(selectedPeriod.quarterStart) : "Not available" },
                    { label: "Quarter end", value: selectedPeriod ? formatDate(selectedPeriod.quarterEnd) : "Not available" },
                  ].map(({ label, value }) => (
                    <div key={label} className="rounded-xl border border-[#B8D0EB] bg-[#DEE9F8] p-4">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-[#2E4A63]">{label}</p>
                      <p className="mt-2 text-sm text-[#0F1C2E]">{value}</p>
                    </div>
                  ))}
                </div>

                {selectedPeriod?.source === "hmrc" ? (
                  <div className="rounded-xl border border-emerald-600/20 bg-emerald-50 p-4">
                    <p className="text-sm text-emerald-700">Using HMRC obligation period.</p>
                    {selectedPeriod.dueDate ? (
                      <p className="mt-2 text-xs text-emerald-700/80">Due date: {formatDate(selectedPeriod.dueDate)}</p>
                    ) : null}
                  </div>
                ) : null}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="turnover" className="mb-2 block text-sm text-[#0F1C2E]">Turnover</label>
                    <input id="turnover" type="number" min="0" step="0.01" placeholder="0.00" value={turnover} onChange={(e) => setTurnover(e.target.value)}
                      className="w-full rounded-xl border border-[#B8D0EB] bg-white px-4 py-3 text-[#0F1C2E] outline-none transition placeholder:text-[#2E4A63] focus:border-[#2E88D0]" />
                  </div>
                  <div>
                    <label htmlFor="expenses" className="mb-2 block text-sm text-[#0F1C2E]">Expenses</label>
                    <input id="expenses" type="number" min="0" step="0.01" placeholder="0.00" value={expenses} onChange={(e) => setExpenses(e.target.value)}
                      className="w-full rounded-xl border border-[#B8D0EB] bg-white px-4 py-3 text-[#0F1C2E] outline-none transition placeholder:text-[#2E4A63] focus:border-[#2E88D0]" />
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button type="submit" disabled={saving || !selectedPeriod}
                    className="rounded-xl bg-[#2E88D0] px-4 py-2.5 text-sm text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60">
                    {saving ? "Saving..." : "Save quarterly update"}
                  </button>
                  <Link href="/dashboard" className="rounded-xl border border-[#B8D0EB] bg-[#CCE0F5] px-4 py-2.5 text-sm text-[#0F1C2E] transition hover:bg-[#B8D0EB]">
                    Cancel
                  </Link>
                </div>

                {message ? <p className="text-sm text-[#2E4A63]">{message}</p> : null}
              </form>
            </>
          )}
        </div>
      </section>
    </SiteShell>
  );
}

export default function AddUpdatePage() {
  return (
    <Suspense fallback={<p className="p-10 text-sm text-[#2E4A63]">Loading...</p>}>
      <AddUpdateContent />
    </Suspense>
  );
}
