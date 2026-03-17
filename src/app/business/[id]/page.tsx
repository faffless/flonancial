"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { SiteShell } from "@/components/site-shell";
import { createClient } from "@/utils/supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────

type Business = {
  id: number;
  name: string;
  business_type: string | null;
  accounting_year_end: string | null;
  hmrc_business_id: string | null;
};

type Transaction = {
  id: number;
  date: string;
  type: "income" | "expense";
  amount: number;
  description: string | null;
  created_at: string;
};

type QuarterlySubmission = {
  id: number;
  period_key: string | null;
  quarter_start: string;
  quarter_end: string;
  turnover: number;
  expenses: number;
  status: "draft" | "submitted";
  submitted_at: string | null;
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
  quarterStart: string;
  quarterEnd: string;
  periodKey: string;
  submission: QuarterlySubmission | null;
  income: number;
  expenses: number;
  transactionCount: number;
  isLocked: boolean;
  isCurrent: boolean;
  isFuture: boolean;
  isPast: boolean;
};

type TaxYear = {
  label: string;
  start: string;
  end: string;
};

type SortField = "date" | "description" | "type" | "amount";
type SortDir = "asc" | "desc";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatBusinessType(value: string | null) {
  if (value === "sole_trader") return "Sole trader";
  if (value === "uk_property") return "UK property";
  if (value === "overseas_property") return "Overseas property";
  return null;
}

function toInputDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function makePeriodKey(start: string, end: string) {
  return `${start}_${end}`;
}

function getTaxYearForDate(dateStr: string, accountingYearEnd: string): TaxYear {
  const [endMonth, endDay] = accountingYearEnd.split("-").map(Number);
  const date = new Date(`${dateStr}T00:00:00`);
  const year = date.getFullYear();

  let yearEnd = new Date(year, endMonth - 1, endDay);
  if (date > yearEnd) yearEnd = new Date(year + 1, endMonth - 1, endDay);

  const yearStart = new Date(yearEnd);
  yearStart.setFullYear(yearStart.getFullYear() - 1);
  yearStart.setDate(yearStart.getDate() + 1);

  const startYear = yearStart.getFullYear();
  const endYear = yearEnd.getFullYear();
  const label = startYear === endYear ? String(startYear) : `${startYear}–${String(endYear).slice(2)}`;

  return { label, start: toInputDate(yearStart), end: toInputDate(yearEnd) };
}

function getQuartersForTaxYear(taxYear: TaxYear): Omit<Quarter, "submission" | "income" | "expenses" | "transactionCount" | "isLocked">[] {
  const now = new Date();
  const cursor = new Date(`${taxYear.start}T00:00:00`);
  const quarters = [];

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

    let label = `Q${i + 1}`;
    if (isCurrent) label += " · current";
    else if (isFuture) label += " · upcoming";

    quarters.push({ label, quarterStart, quarterEnd, periodKey: makePeriodKey(quarterStart, quarterEnd), isCurrent, isFuture, isPast });
    cursor.setMonth(cursor.getMonth() + 3);
  }

  return quarters;
}

function deriveAvailableYears(transactions: Transaction[], accountingYearEnd: string): TaxYear[] {
  const yearMap = new Map<string, TaxYear>();

  for (const t of transactions) {
    const ty = getTaxYearForDate(t.date, accountingYearEnd);
    if (!yearMap.has(ty.label)) yearMap.set(ty.label, ty);
  }

  const today = toInputDate(new Date());
  const currentTy = getTaxYearForDate(today, accountingYearEnd);
  if (!yearMap.has(currentTy.label)) yearMap.set(currentTy.label, currentTy);

  return Array.from(yearMap.values()).sort((a, b) => b.start.localeCompare(a.start));
}

// ─── Modal ────────────────────────────────────────────────────────────────────

type ModalMode = "add" | "edit" | null;

type TransactionModalProps = {
  mode: ModalMode;
  transaction?: Transaction | null;
  onClose: () => void;
  onSave: (data: { date: string; type: "income" | "expense"; amount: number; description: string }) => Promise<void>;
  onDelete?: () => Promise<void>;
  saving: boolean;
};

function TransactionModal({ mode, transaction, onClose, onSave, onDelete, saving }: TransactionModalProps) {
  const [date, setDate] = useState(transaction?.date ?? toInputDate(new Date()));
  const [type, setType] = useState<"income" | "expense">(transaction?.type ?? "income");
  const [amount, setAmount] = useState(transaction ? String(transaction.amount) : "");
  const [description, setDescription] = useState(transaction?.description ?? "");
  const [error, setError] = useState("");

  async function handleSave() {
    if (!date) { setError("Enter a date"); return; }
    const amt = Number(amount);
    if (!amount || !Number.isFinite(amt) || amt <= 0) { setError("Enter a valid amount greater than zero"); return; }
    setError("");
    await onSave({ date, type, amount: amt, description: description.trim() });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-2xl border border-[#B8D0EB] bg-white p-6 shadow-xl">
        <h2 className="text-lg font-medium text-[#0F1C2E]">
          {mode === "add" ? "Add transaction" : "Edit transaction"}
        </h2>
        <div className="mt-5 space-y-4">
          <div>
            <label className="mb-2 block text-sm text-[#0F1C2E]">Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full rounded-xl border border-[#B8D0EB] bg-white px-4 py-3 text-[#0F1C2E] outline-none transition focus:border-[#2E88D0]" />
          </div>
          <div>
            <label className="mb-2 block text-sm text-[#0F1C2E]">Type</label>
            <select value={type} onChange={(e) => setType(e.target.value as "income" | "expense")} className="w-full rounded-xl border border-[#B8D0EB] bg-white px-4 py-3 text-[#0F1C2E] outline-none transition focus:border-[#2E88D0]">
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm text-[#0F1C2E]">Amount (£)</label>
            <input type="number" min="0.01" step="0.01" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full rounded-xl border border-[#B8D0EB] bg-white px-4 py-3 text-[#0F1C2E] outline-none transition placeholder:text-[#3B5A78] focus:border-[#2E88D0]" />
          </div>
          <div>
            <label className="mb-2 block text-sm text-[#0F1C2E]">Description <span className="text-[#3B5A78]">(optional)</span></label>
            <input type="text" maxLength={255} placeholder="e.g. Invoice #123, Office supplies" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full rounded-xl border border-[#B8D0EB] bg-white px-4 py-3 text-[#0F1C2E] outline-none transition placeholder:text-[#3B5A78] focus:border-[#2E88D0]" />
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-3">
            <button type="button" onClick={handleSave} disabled={saving} className="rounded-xl bg-[#2E88D0] px-4 py-2.5 text-sm text-white transition hover:opacity-90 disabled:opacity-60">
              {saving ? "Saving..." : mode === "add" ? "Add transaction" : "Save changes"}
            </button>
            <button type="button" onClick={onClose} disabled={saving} className="rounded-xl border border-[#B8D0EB] bg-[#CCE0F5] px-4 py-2.5 text-sm text-[#0F1C2E] transition hover:bg-[#B8D0EB]">
              Cancel
            </button>
          </div>
          {mode === "edit" && onDelete ? (
            <button type="button" onClick={onDelete} disabled={saving} className="text-sm text-red-600 transition hover:text-red-800 disabled:opacity-60">Delete</button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ─── Sort indicator ───────────────────────────────────────────────────────────

function SortIndicator({ field, current, dir }: { field: SortField; current: SortField; dir: SortDir }) {
  if (field !== current) return <span className="ml-1 text-[#B8D0EB]">↕</span>;
  return <span className="ml-1 text-[#2E88D0]">{dir === "asc" ? "↑" : "↓"}</span>;
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function BusinessPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const businessId = Number(params.id);

  const [business, setBusiness] = useState<Business | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [submissions, setSubmissions] = useState<QuarterlySubmission[]>([]);
  const [obligations, setObligations] = useState<HmrcObligation[]>([]);
  const [loadingObligations, setLoadingObligations] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [selectedYearLabel, setSelectedYearLabel] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [modalSaving, setModalSaving] = useState(false);

  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");
  const [filterSearch, setFilterSearch] = useState("");
  const [filterQuarter, setFilterQuarter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const loadData = useCallback(async () => {
    if (!Number.isFinite(businessId)) { setNotFound(true); setLoading(false); return; }

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) { router.replace("/login"); return; }

    const { data: businessData, error: businessError } = await supabase
      .from("businesses")
      .select("id, name, business_type, accounting_year_end, hmrc_business_id")
      .eq("id", businessId)
      .eq("user_id", user.id)
      .single();

    if (businessError || !businessData) { setNotFound(true); setLoading(false); return; }

    const { data: txData } = await supabase
      .from("transactions")
      .select("id, date, type, amount, description, created_at")
      .eq("business_id", businessId)
      .eq("user_id", user.id)
      .order("date", { ascending: false });

    const { data: subData } = await supabase
      .from("quarterly_updates")
      .select("id, period_key, quarter_start, quarter_end, turnover, expenses, status, submitted_at")
      .eq("business_id", businessId)
      .eq("user_id", user.id)
      .order("quarter_start", { ascending: true });

    setBusiness(businessData);
    setTransactions((txData ?? []) as Transaction[]);
    setSubmissions((subData ?? []) as QuarterlySubmission[]);
    setLoading(false);
  }, [businessId, supabase, router]);

  useEffect(() => { loadData(); }, [loadData]);

  const fetchObligations = useCallback(async (taxYear: TaxYear) => {
    if (!business?.hmrc_business_id) return;
    setLoadingObligations(true);
    try {
      const response = await fetch(
        `/api/hmrc/obligations?businessId=${businessId}&fromDate=${taxYear.start}&toDate=${taxYear.end}`,
        { method: "GET", credentials: "include", cache: "no-store" }
      );
      if (!response.ok) { setObligations([]); return; }
      const data = await response.json();
      setObligations(data.obligations ?? []);
    } catch {
      setObligations([]);
    } finally {
      setLoadingObligations(false);
    }
  }, [business?.hmrc_business_id, businessId]);

  const availableYears = useMemo(() => {
    if (!business?.accounting_year_end) return [];
    return deriveAvailableYears(transactions, business.accounting_year_end);
  }, [transactions, business]);

  const selectedYear = useMemo(() => {
    if (availableYears.length === 0) return null;
    if (selectedYearLabel) return availableYears.find((y) => y.label === selectedYearLabel) ?? availableYears[0];
    const yearsWithTx = availableYears.filter((y) => transactions.some((t) => t.date >= y.start && t.date <= y.end));
    return yearsWithTx.length > 0 ? yearsWithTx[0] : availableYears[0];
  }, [availableYears, selectedYearLabel, transactions]);

  useEffect(() => {
    if (selectedYear && business?.hmrc_business_id) fetchObligations(selectedYear);
  }, [selectedYear, business?.hmrc_business_id, fetchObligations]);

  const quarters: Quarter[] = useMemo(() => {
    if (!selectedYear || !business?.accounting_year_end) return [];
    return getQuartersForTaxYear(selectedYear).map((q) => {
      const submission = submissions.find((s) => s.quarter_start === q.quarterStart && s.quarter_end === q.quarterEnd) ?? null;
      const qTransactions = transactions.filter((t) => t.date >= q.quarterStart && t.date <= q.quarterEnd);
      const income = qTransactions.filter((t) => t.type === "income").reduce((sum, t) => sum + Number(t.amount), 0);
      const expenses = qTransactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + Number(t.amount), 0);
      const isLocked = submission?.status === "submitted";
      return { ...q, submission, income, expenses, transactionCount: qTransactions.length, isLocked };
    });
  }, [selectedYear, business, transactions, submissions]);

  const annualTotals = useMemo(() => {
    if (!selectedYear) return { income: 0, expenses: 0 };
    const yt = transactions.filter((t) => t.date >= selectedYear.start && t.date <= selectedYear.end);
    return {
      income: yt.filter((t) => t.type === "income").reduce((sum, t) => sum + Number(t.amount), 0),
      expenses: yt.filter((t) => t.type === "expense").reduce((sum, t) => sum + Number(t.amount), 0),
    };
  }, [selectedYear, transactions]);

  const yearTransactions = useMemo(() => {
    if (!selectedYear) return transactions;
    return transactions.filter((t) => t.date >= selectedYear.start && t.date <= selectedYear.end);
  }, [transactions, selectedYear]);

  const filteredTransactions = useMemo(() => {
    let result = [...yearTransactions];
    if (filterType !== "all") result = result.filter((t) => t.type === filterType);
    if (filterSearch) {
      const s = filterSearch.toLowerCase();
      result = result.filter((t) => t.description?.toLowerCase().includes(s) || String(t.amount).includes(s));
    }
    if (filterQuarter !== "all") {
      const q = quarters.find((q) => q.periodKey === filterQuarter);
      if (q) result = result.filter((t) => t.date >= q.quarterStart && t.date <= q.quarterEnd);
    }
    result.sort((a, b) => {
      let valA: string | number;
      let valB: string | number;
      if (sortField === "date") { valA = a.date; valB = b.date; }
      else if (sortField === "description") { valA = a.description?.toLowerCase() ?? ""; valB = b.description?.toLowerCase() ?? ""; }
      else if (sortField === "type") { valA = a.type; valB = b.type; }
      else { valA = Number(a.amount); valB = Number(b.amount); }
      if (valA < valB) return sortDir === "asc" ? -1 : 1;
      if (valA > valB) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return result;
  }, [yearTransactions, filterType, filterSearch, filterQuarter, quarters, sortField, sortDir]);

  function handleSort(field: SortField) {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir(field === "date" ? "desc" : "asc"); }
  }

  function isTransactionLocked(transaction: Transaction): boolean {
    return quarters.some((q) => q.isLocked && transaction.date >= q.quarterStart && transaction.date <= q.quarterEnd);
  }

  function isLatestSubmission(periodKey: string): boolean {
    const submittedQuarters = quarters.filter((q) => q.isLocked).sort((a, b) => b.quarterEnd.localeCompare(a.quarterEnd));
    return submittedQuarters[0]?.periodKey === periodKey;
  }

  function isCoveredByLaterSubmission(quarterEnd: string): boolean {
    return quarters.some((q) => q.isLocked && q.quarterEnd > quarterEnd);
  }

  function hasOpenObligation(quarterStart: string, quarterEnd: string): boolean {
    if (!business?.hmrc_business_id) return true;
    if (loadingObligations) return false;
    if (obligations.length === 0) return false;
    return obligations.some((o) => {
      if (!o.quarter_start || !o.quarter_end) return false;
      const isOpen = o.status === "O" || o.status === "open";
      if (!isOpen) return false;
      return quarterStart >= o.quarter_start && quarterEnd <= o.quarter_end;
    });
  }

  function exportTransactions() {
    const toExport = selectedYear
      ? transactions.filter((t) => t.date >= selectedYear.start && t.date <= selectedYear.end)
      : transactions;

    const rows = [
      ["Date", "Type", "Amount (GBP)", "Description"],
      ...toExport
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((t) => [
          t.date,
          t.type === "income" ? "Income" : "Expense",
          Number(t.amount).toFixed(2),
          t.description ?? "",
        ]),
    ];

    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${business?.name ?? "transactions"}_${selectedYear?.label ?? "all"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleAddTransaction(data: { date: string; type: "income" | "expense"; amount: number; description: string }) {
    setModalSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }
    const { error } = await supabase.from("transactions").insert({
      user_id: user.id,
      business_id: businessId,
      date: data.date,
      type: data.type,
      amount: data.amount,
      description: data.description || null,
    });
    setModalSaving(false);
    if (error) { window.alert(error.message); return; }
    setModalMode(null);
    await loadData();
  }

  async function handleEditTransaction(data: { date: string; type: "income" | "expense"; amount: number; description: string }) {
    if (!editingTransaction) return;
    setModalSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }
    const { error } = await supabase
      .from("transactions")
      .update({ date: data.date, type: data.type, amount: data.amount, description: data.description || null })
      .eq("id", editingTransaction.id)
      .eq("user_id", user.id);
    setModalSaving(false);
    if (error) { window.alert(error.message); return; }
    setModalMode(null);
    setEditingTransaction(null);
    await loadData();
  }

  async function handleDeleteTransaction() {
    if (!editingTransaction) return;
    const confirmed = window.confirm("Delete this transaction? This cannot be undone.");
    if (!confirmed) return;
    setModalSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }
    const { error } = await supabase.from("transactions").delete().eq("id", editingTransaction.id).eq("user_id", user.id);
    setModalSaving(false);
    if (error) { window.alert(error.message); return; }
    setModalMode(null);
    setEditingTransaction(null);
    await loadData();
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <SiteShell>
        <section className="mx-auto w-full max-w-[1000px] px-6 py-10 sm:px-8 lg:px-10">
          <p className="text-sm text-[#3B5A78]">Loading...</p>
        </section>
      </SiteShell>
    );
  }

  if (notFound || !business) {
    return (
      <SiteShell>
        <section className="mx-auto w-full max-w-[1000px] px-6 py-10 sm:px-8 lg:px-10">
          <p className="text-sm text-[#3B5A78]">Business not found.</p>
          <Link href="/dashboard" className="mt-4 block text-sm text-[#2E88D0] hover:opacity-75">Back to dashboard</Link>
        </section>
      </SiteShell>
    );
  }

  const businessType = formatBusinessType(business.business_type);
  const isHmrcReady = Boolean(business.hmrc_business_id);

  return (
    <SiteShell>
      <section className="mx-auto w-full max-w-[1000px] px-6 py-10 sm:px-8 lg:px-10">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-normal tracking-tight text-[#0F1C2E]">{business.name}</h1>
            {businessType ? <span className="text-sm text-[#3B5A78]">{businessType}</span> : null}
            {isHmrcReady ? (
              <span className="rounded-full border border-emerald-600/20 bg-emerald-50 px-2.5 py-1 text-[11px] text-emerald-700">HMRC ready</span>
            ) : (
              <span className="rounded-full border border-amber-600/20 bg-amber-50 px-2.5 py-1 text-[11px] text-amber-700">Not matched to HMRC</span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <Link href={`/edit-business/${business.id}`} className="text-sm text-[#3B5A78] transition hover:text-[#0F1C2E]">Edit business</Link>
            <Link href="/dashboard" className="text-sm text-[#3B5A78] transition hover:text-[#0F1C2E]">Dashboard</Link>
          </div>
        </div>

        {/* Year selector */}
        {availableYears.length > 0 && selectedYear ? (
          <div className="mt-6 flex items-center gap-3">
            <label className="text-sm text-[#3B5A78]">Tax year</label>
            <select value={selectedYear.label} onChange={(e) => { setSelectedYearLabel(e.target.value); setFilterQuarter("all"); }} className="rounded-xl border border-[#B8D0EB] bg-white px-3 py-2 text-sm text-[#0F1C2E] outline-none transition focus:border-[#2E88D0]">
              {availableYears.map((y) => <option key={y.label} value={y.label}>{y.label}</option>)}
            </select>
            {isHmrcReady && loadingObligations ? <span className="text-xs text-[#3B5A78]">Checking HMRC obligations...</span> : null}
          </div>
        ) : null}

        {/* Quarterly summary cards */}
        {quarters.length > 0 && selectedYear ? (
          <div className="mt-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {quarters.map((q) => (
                <div key={q.periodKey} className={`rounded-2xl border p-4 ${q.isFuture ? "border-[#B8D0EB] bg-[#DEE9F8] opacity-50" : q.isLocked ? "border-emerald-600/20 bg-emerald-50" : q.isCurrent ? "border-[#2E88D0]/30 bg-[#CCE0F5]" : "border-amber-600/20 bg-amber-50"}`}>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#3B5A78]">{q.label}</p>
                    {q.isLocked ? (
                      <span className="rounded-full border border-emerald-600/20 bg-emerald-100 px-2 py-0.5 text-[10px] text-emerald-700">
                        {isCoveredByLaterSubmission(q.quarterEnd) ? "Covered" : "Submitted"}
                      </span>
                    ) : q.isFuture ? null : (
                      <span className="rounded-full border border-amber-600/20 bg-amber-100 px-2 py-0.5 text-[10px] text-amber-700">Not submitted</span>
                    )}
                  </div>
                  <p className="mt-2 text-[11px] text-[#3B5A78]">{formatDate(q.quarterStart)} – {formatDate(q.quarterEnd)}</p>
                  <div className="mt-3 space-y-1">
                    <p className="text-xs text-[#3B5A78]">Income: <span className="font-medium text-[#0F1C2E]">{formatCurrency(q.income)}</span></p>
                    <p className="text-xs text-[#3B5A78]">Expenses: <span className="font-medium text-[#0F1C2E]">{formatCurrency(q.expenses)}</span></p>
                    <p className="text-xs text-[#3B5A78]">Net income: <span className={`font-medium ${q.income - q.expenses >= 0 ? "text-emerald-700" : "text-red-600"}`}>{formatCurrency(q.income - q.expenses)}</span></p>
                  </div>
                  <p className="mt-2 text-[10px] text-[#3B5A78]">{q.transactionCount} transaction{q.transactionCount !== 1 ? "s" : ""}</p>

                  {!q.isFuture && isHmrcReady ? (
                    <div className="mt-3">
                      {q.isLocked && isLatestSubmission(q.periodKey) ? (
                        <Link href={`/hmrc-submit?businessId=${business.id}&periodKey=${encodeURIComponent(q.periodKey)}`} className="text-xs text-[#3B5A78] transition hover:text-[#0F1C2E]">Amend →</Link>
                      ) : q.isLocked ? (
                        <p className="text-[10px] text-[#3B5A78]">Any corrections carry forward to your next submission</p>
                      ) : q.isPast && !isCoveredByLaterSubmission(q.quarterEnd) && hasOpenObligation(q.quarterStart, q.quarterEnd) && q.transactionCount > 0 ? (
                        <Link href={`/hmrc-submit?businessId=${business.id}&periodKey=${encodeURIComponent(q.periodKey)}`} className="text-xs font-medium text-[#2E88D0] transition hover:opacity-75">Submit to HMRC →</Link>
                      ) : q.isPast && !isCoveredByLaterSubmission(q.quarterEnd) && hasOpenObligation(q.quarterStart, q.quarterEnd) ? (
                        <p className="text-[10px] text-[#3B5A78]">No transactions to submit</p>
                      ) : q.isPast && !isCoveredByLaterSubmission(q.quarterEnd) && !loadingObligations ? (
                        <p className="text-[10px] text-[#3B5A78]">No open HMRC obligation for this period</p>
                      ) : q.isPast && isCoveredByLaterSubmission(q.quarterEnd) ? (
                        <p className="text-[10px] text-[#3B5A78]">Covered by a later submission</p>
                      ) : (
                        <p className="text-[10px] text-[#3B5A78]">Available to submit after {formatDate(q.quarterEnd)}</p>
                      )}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>

            {/* Annual totals */}
            <div className="mt-4 rounded-2xl border border-[#B8D0EB] bg-[#CCE0F5] p-4">
              <div className="flex flex-wrap items-center gap-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#3B5A78]">{selectedYear.label} totals</p>
                <p className="text-xs text-[#3B5A78]">Income: <span className="font-medium text-[#0F1C2E]">{formatCurrency(annualTotals.income)}</span></p>
                <p className="text-xs text-[#3B5A78]">Expenses: <span className="font-medium text-[#0F1C2E]">{formatCurrency(annualTotals.expenses)}</span></p>
                <p className="text-xs text-[#3B5A78]">Net income: <span className={`font-medium ${annualTotals.income - annualTotals.expenses >= 0 ? "text-emerald-700" : "text-red-600"}`}>{formatCurrency(annualTotals.income - annualTotals.expenses)}</span></p>
              </div>
            </div>
          </div>
        ) : null}

        {/* Transactions */}
        <div className="mt-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-lg font-medium text-[#0F1C2E]">
              Transactions
              {selectedYear ? <span className="ml-2 text-sm font-normal text-[#3B5A78]">{selectedYear.label}</span> : null}
            </h2>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={exportTransactions}
                disabled={yearTransactions.length === 0}
                className="rounded-xl border border-[#B8D0EB] bg-[#DEE9F8] px-4 py-2 text-sm text-[#0F1C2E] transition hover:bg-[#B8D0EB] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Export CSV
              </button>
              <button
                type="button"
                onClick={() => { setEditingTransaction(null); setModalMode("add"); }}
                className="rounded-xl bg-[#2E88D0] px-4 py-2 text-sm text-white transition hover:opacity-90"
              >
                + Add transaction
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="mt-4 flex flex-wrap gap-3">
            <select value={filterType} onChange={(e) => setFilterType(e.target.value as "all" | "income" | "expense")} className="rounded-xl border border-[#B8D0EB] bg-white px-3 py-2 text-sm text-[#0F1C2E] outline-none transition focus:border-[#2E88D0]">
              <option value="all">All types</option>
              <option value="income">Income only</option>
              <option value="expense">Expenses only</option>
            </select>
            <select value={filterQuarter} onChange={(e) => setFilterQuarter(e.target.value)} className="rounded-xl border border-[#B8D0EB] bg-white px-3 py-2 text-sm text-[#0F1C2E] outline-none transition focus:border-[#2E88D0]">
              <option value="all">All quarters</option>
              {quarters.map((q) => <option key={q.periodKey} value={q.periodKey}>{q.label}</option>)}
            </select>
            <input type="text" placeholder="Search description..." value={filterSearch} onChange={(e) => setFilterSearch(e.target.value)} className="rounded-xl border border-[#B8D0EB] bg-white px-3 py-2 text-sm text-[#0F1C2E] outline-none transition placeholder:text-[#3B5A78] focus:border-[#2E88D0]" />
            {filterType !== "all" || filterQuarter !== "all" || filterSearch ? (
              <button type="button" onClick={() => { setFilterType("all"); setFilterQuarter("all"); setFilterSearch(""); }} className="rounded-xl border border-[#B8D0EB] bg-[#DEE9F8] px-3 py-2 text-sm text-[#3B5A78] transition hover:bg-[#B8D0EB]">Clear filters</button>
            ) : null}
          </div>

          {/* Table */}
          <div className="mt-4 overflow-hidden rounded-2xl border border-[#B8D0EB]">
            {filteredTransactions.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm text-[#3B5A78]">
                  {yearTransactions.length === 0 ? "No transactions yet for this year. Add your first transaction to get started." : "No transactions match your filters."}
                </p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#CCE0F5] text-[#3B5A78] text-xs uppercase tracking-wide">
                    {([
                      { field: "date" as SortField, label: "Date", align: "left" },
                      { field: "description" as SortField, label: "Description", align: "left" },
                      { field: "type" as SortField, label: "Type", align: "left" },
                      { field: "amount" as SortField, label: "Amount", align: "right" },
                    ] as const).map(({ field, label, align }) => (
                      <th key={field} onClick={() => handleSort(field)} className={`px-5 py-3 font-semibold cursor-pointer select-none hover:text-[#0F1C2E] text-${align}`}>
                        {label}<SortIndicator field={field} current={sortField} dir={sortDir} />
                      </th>
                    ))}
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((t, i) => {
                    const locked = isTransactionLocked(t);
                    return (
                      <tr key={t.id} className={`${i % 2 === 0 ? "bg-white" : "bg-[#f4f8fd]"} ${locked ? "opacity-50" : ""}`}>
                        <td className="px-5 py-3 text-[#3B5A78] whitespace-nowrap">{formatDate(t.date)}</td>
                        <td className="px-5 py-3 text-[#0F1C2E]">{t.description || <span className="text-[#3B5A78]">—</span>}</td>
                        <td className="px-5 py-3">
                          <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${t.type === "income" ? "bg-emerald-50 text-emerald-700 border border-emerald-600/20" : "bg-amber-50 text-amber-700 border border-amber-600/20"}`}>
                            {t.type === "income" ? "Income" : "Expense"}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right font-medium text-[#0F1C2E]">{formatCurrency(Number(t.amount))}</td>
                        <td className="px-5 py-3 text-right">
                          {locked ? (
                            <span className="text-xs text-[#3B5A78]">🔒</span>
                          ) : (
                            <button type="button" onClick={() => { setEditingTransaction(t); setModalMode("edit"); }} className="text-xs text-[#3B5A78] transition hover:text-[#0F1C2E]">Edit</button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Filtered totals footer */}
          {filteredTransactions.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-6 px-1">
              <p className="text-xs text-[#3B5A78]">{filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? "s" : ""}</p>
              <p className="text-xs text-[#3B5A78]">Income: <span className="font-medium text-[#0F1C2E]">{formatCurrency(filteredTransactions.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0))}</span></p>
              <p className="text-xs text-[#3B5A78]">Expenses: <span className="font-medium text-[#0F1C2E]">{formatCurrency(filteredTransactions.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0))}</span></p>
              <p className="text-xs text-[#3B5A78]">Net income: <span className="font-medium text-[#0F1C2E]">{formatCurrency(filteredTransactions.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0) - filteredTransactions.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0))}</span></p>
            </div>
          ) : null}
        </div>
      </section>

      {modalMode ? (
        <TransactionModal
          mode={modalMode}
          transaction={editingTransaction}
          onClose={() => { setModalMode(null); setEditingTransaction(null); }}
          onSave={modalMode === "add" ? handleAddTransaction : handleEditTransaction}
          onDelete={modalMode === "edit" ? handleDeleteTransaction : undefined}
          saving={modalSaving}
        />
      ) : null}
    </SiteShell>
  );
}