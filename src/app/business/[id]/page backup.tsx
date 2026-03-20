"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
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
  upload_id: number | null;
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

type Upload = {
  id: number;
  filename: string;
  uploaded_at: string;
  total_rows: number;
  inserted_count: number;
  duplicate_count: number;
  invalid_count: number;
  deleted_count: number;
};

type SortField = "date" | "description" | "type" | "amount";
type SortDir = "asc" | "desc";

type InvalidRow = {
  row: number;
  reason: string;
};

type ParsedRow = {
  date: string;
  description: string;
  type: "income" | "expense";
  amount: number;
};

type StagingResult = {
  filename: string;
  validRows: ParsedRow[];
  duplicateCount: number;
  invalidRows: InvalidRow[];
  totalRows: number;
};

type DeleteUploadState = {
  upload: Upload;
  submittedCount: number;
  deletableCount: number;
  submittedPeriods: string[];
} | null;

const MTD_START_DATE = "2025-04-06";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

function formatDate(value: string) {
  return new Date(`${value}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

// Always use UTC to avoid BST offset shifting dates back by one day
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

function getQuartersForTaxYear(taxYear: TaxYear): Omit<Quarter, "submission" | "income" | "expenses" | "transactionCount" | "isLocked">[] {
  const now = new Date();
  const cursor = new Date(`${taxYear.start}T00:00:00Z`);
  const quarters = [];

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

    quarters.push({ label, quarterStart, quarterEnd, periodKey: makePeriodKey(quarterStart, quarterEnd), isCurrent, isFuture, isPast });

    cursor.setUTCMonth(cursor.getUTCMonth() + 3);
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

// ─── CSV parsing ──────────────────────────────────────────────────────────────

function parseDate(raw: string, rowNum: number): { value: string | null; error: string | null } {
  const s = raw.trim();
  if (!s) return { value: null, error: `Row ${rowNum}: Date is empty` };

  let iso: string | null = null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) iso = s;

  if (!iso) {
    const dmy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (dmy) iso = `${dmy[3]}-${dmy[2].padStart(2, "0")}-${dmy[1].padStart(2, "0")}`;
  }

  if (!iso) {
    const dmyDash = s.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
    if (dmyDash) iso = `${dmyDash[3]}-${dmyDash[2].padStart(2, "0")}-${dmyDash[1].padStart(2, "0")}`;
  }

  if (!iso) return { value: null, error: `Row ${rowNum}: Date format not recognised ("${s}") — use YYYY-MM-DD or DD/MM/YYYY` };

  const d = new Date(`${iso}T00:00:00Z`);
  if (isNaN(d.getTime())) return { value: null, error: `Row ${rowNum}: Invalid date ("${s}")` };

  if (iso < MTD_START_DATE) {
    return { value: null, error: `Row ${rowNum}: Date ${formatDate(iso)} is before the MTD start date (6 April 2025) — only transactions from 6 April 2025 onwards are accepted` };
  }

  return { value: iso, error: null };
}

function parseAmount(raw: string, rowNum: number): { value: number | null; error: string | null } {
  const s = raw.trim();
  if (!s) return { value: null, error: `Row ${rowNum}: Amount is empty` };
  const cleaned = s.replace(/[£$€,\s]/g, "");
  if (/[a-zA-Z]/.test(cleaned)) return { value: null, error: `Row ${rowNum}: Amount contains letters ("${s}") — enter a number only` };
  const num = parseFloat(cleaned);
  if (!Number.isFinite(num) || num <= 0) return { value: null, error: `Row ${rowNum}: Amount must be a positive number ("${s}")` };
  return { value: Math.round(num * 100) / 100, error: null };
}

function parseType(raw: string, rowNum: number): { value: "income" | "expense" | null; error: string | null } {
  const s = raw.trim().toLowerCase();
  if (s === "income" || s === "in") return { value: "income", error: null };
  if (s === "expense" || s === "expenses" || s === "exp" || s === "out") return { value: "expense", error: null };
  return { value: null, error: `Row ${rowNum}: Type must be "income" or "expense" (found: "${raw.trim()}")` };
}

function parseCSV(text: string): string[][] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  return lines.map((line) => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
        else inQuotes = !inQuotes;
      } else if (ch === "," && !inQuotes) {
        result.push(current);
        current = "";
      } else {
        current += ch;
      }
    }
    result.push(current);
    return result;
  });
}

function formatUploadDownloadFilename(upload: Upload): string {
  const date = new Date(upload.uploaded_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).replace(/ /g, "");
  const base = upload.filename.replace(/\.csv$/i, "");
  return `${base}_uploaded${date}_redownload.csv`;
}

// ─── Sort indicator ───────────────────────────────────────────────────────────

function SortIndicator({ field, current, dir }: { field: SortField; current: SortField; dir: SortDir }) {
  if (field !== current) return <span className="ml-1 text-[#B8D0EB]">↕</span>;
  return <span className="ml-1 text-[#2E88D0]">{dir === "asc" ? "↑" : "↓"}</span>;
}

// ─── Staging modal ────────────────────────────────────────────────────────────

function StagingModal({ staging, onConfirm, onCancel, confirming }: {
  staging: StagingResult;
  onConfirm: () => void;
  onCancel: () => void;
  confirming: boolean;
}) {
  const hasValid = staging.validRows.length > 0;
  const hasInvalid = staging.invalidRows.length > 0;
  const hasDuplicates = staging.duplicateCount > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-lg rounded-2xl border border-[#B8D0EB] bg-white p-6 shadow-xl">
        <h2 className="text-lg font-medium text-[#0F1C2E]">Review before importing</h2>
        <p className="mt-1 text-sm text-[#3B5A78]">{staging.filename}</p>
        <div className="mt-4 space-y-2">
          <div className="flex items-center gap-3 rounded-xl border border-emerald-600/20 bg-emerald-50 px-4 py-2.5">
            <span className="text-emerald-600">✓</span>
            <p className="text-sm text-emerald-700"><span className="font-semibold">{staging.validRows.length}</span> new transaction{staging.validRows.length !== 1 ? "s" : ""} ready to import</p>
          </div>
          {hasDuplicates ? (
            <div className="flex items-center gap-3 rounded-xl border border-[#B8D0EB] bg-[#DEE9F8] px-4 py-2.5">
              <span className="text-[#3B5A78]">↩</span>
              <p className="text-sm text-[#3B5A78]"><span className="font-semibold">{staging.duplicateCount}</span> duplicate{staging.duplicateCount !== 1 ? "s" : ""} already in your records — will be skipped</p>
            </div>
          ) : null}
          {hasInvalid ? (
            <div className="rounded-xl border border-amber-600/20 bg-amber-50 px-4 py-3">
              <p className="text-sm font-medium text-amber-700"><span className="font-semibold">{staging.invalidRows.length}</span> row{staging.invalidRows.length !== 1 ? "s" : ""} cannot be imported:</p>
              <div className="mt-2 max-h-32 space-y-1 overflow-y-auto">
                {staging.invalidRows.map((r, i) => (
                  <p key={i} className="text-xs text-amber-700">— {r.reason}</p>
                ))}
              </div>
            </div>
          ) : null}
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          {hasValid ? (
            <button type="button" onClick={onConfirm} disabled={confirming} className="rounded-xl bg-[#2E88D0] px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60">
              {confirming ? "Importing..." : `Import ${staging.validRows.length} transaction${staging.validRows.length !== 1 ? "s" : ""}`}
            </button>
          ) : null}
          <button type="button" onClick={onCancel} disabled={confirming} className="rounded-xl border border-[#B8D0EB] bg-[#DEE9F8] px-5 py-2.5 text-sm text-[#0F1C2E] transition hover:bg-[#B8D0EB] disabled:opacity-60">
            {hasValid ? "Cancel — I'll fix the file first" : "Close"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete upload modal ──────────────────────────────────────────────────────

function DeleteUploadModal({ state, onConfirm, onCancel, deleting }: {
  state: DeleteUploadState;
  onConfirm: () => void;
  onCancel: () => void;
  deleting: boolean;
}) {
  if (!state) return null;
  const { upload, submittedCount, deletableCount, submittedPeriods } = state;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-lg rounded-2xl border border-[#B8D0EB] bg-white p-6 shadow-xl">
        <h2 className="text-lg font-medium text-[#0F1C2E]">Delete upload</h2>
        <p className="mt-1 text-sm text-[#3B5A78]">{upload.filename}</p>
        <div className="mt-4 space-y-2">
          {submittedCount > 0 ? (
            <div className="rounded-xl border border-amber-600/20 bg-amber-50 px-4 py-3">
              <p className="text-sm text-amber-700">
                <span className="font-semibold">{submittedCount}</span> transaction{submittedCount !== 1 ? "s" : ""} from this upload {submittedCount === 1 ? "has" : "have"} already been submitted to HMRC
                {submittedPeriods.length > 0 ? ` (${submittedPeriods.join(", ")})` : ""} and will be kept in your records. Only the {deletableCount} unsubmitted transaction{deletableCount !== 1 ? "s" : ""} below will be removed.
              </p>
            </div>
          ) : null}
          <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3">
            <p className="text-sm text-red-700">
              <span className="font-semibold">{deletableCount}</span> transaction{deletableCount !== 1 ? "s" : ""} will be permanently removed from your records.
            </p>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <button type="button" onClick={onConfirm} disabled={deleting} className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60">
            {deleting ? "Deleting..." : `Delete ${deletableCount} transaction${deletableCount !== 1 ? "s" : ""}`}
          </button>
          <button type="button" onClick={onCancel} disabled={deleting} className="rounded-xl border border-[#B8D0EB] bg-[#DEE9F8] px-5 py-2.5 text-sm text-[#0F1C2E] transition hover:bg-[#B8D0EB] disabled:opacity-60">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function BusinessPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const businessId = Number(params.id);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [business, setBusiness] = useState<Business | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [submissions, setSubmissions] = useState<QuarterlySubmission[]>([]);
  const [obligations, setObligations] = useState<HmrcObligation[]>([]);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [loadingObligations, setLoadingObligations] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [selectedYearLabel, setSelectedYearLabel] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");
  const [filterSearch, setFilterSearch] = useState("");
  const [filterQuarter, setFilterQuarter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const [staging, setStaging] = useState<StagingResult | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [deleteUploadState, setDeleteUploadState] = useState<DeleteUploadState>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async () => {
    if (!Number.isFinite(businessId)) { setNotFound(true); setLoading(false); return; }
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) { router.replace("/login"); return; }
    const { data: businessData, error: businessError } = await supabase
      .from("businesses").select("id, name, business_type, accounting_year_end, hmrc_business_id")
      .eq("id", businessId).eq("user_id", user.id).single();
    if (businessError || !businessData) { setNotFound(true); setLoading(false); return; }
    const { data: txData } = await supabase.from("transactions")
      .select("id, date, type, amount, description, created_at, upload_id")
      .eq("business_id", businessId).eq("user_id", user.id).order("date", { ascending: false });
    const { data: subData } = await supabase.from("quarterly_updates")
      .select("id, period_key, quarter_start, quarter_end, turnover, expenses, status, submitted_at")
      .eq("business_id", businessId).eq("user_id", user.id).order("quarter_start", { ascending: true });
    const { data: uploadData } = await supabase.from("uploads")
      .select("id, filename, uploaded_at, total_rows, inserted_count, duplicate_count, invalid_count, deleted_count")
      .eq("business_id", businessId).eq("user_id", user.id).order("uploaded_at", { ascending: false });
    setBusiness(businessData);
    setTransactions((txData ?? []) as Transaction[]);
    setSubmissions((subData ?? []) as QuarterlySubmission[]);
    setUploads((uploadData ?? []) as Upload[]);
    setLoading(false);
  }, [businessId, supabase, router]);

  useEffect(() => { loadData(); }, [loadData]);

  const fetchObligations = useCallback(async (taxYear: TaxYear) => {
    if (!business?.hmrc_business_id) return;
    setLoadingObligations(true);
    try {
      const response = await fetch(`/api/hmrc/obligations?businessId=${businessId}&fromDate=${taxYear.start}&toDate=${taxYear.end}`, { method: "GET", credentials: "include", cache: "no-store" });
      if (!response.ok) { setObligations([]); return; }
      const data = await response.json();
      setObligations(data.obligations ?? []);
    } catch { setObligations([]); }
    finally { setLoadingObligations(false); }
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
    // Because submissions are cumulative from tax year start, submitting Q2
    // covers all transactions from April through October — including those in Q1.
    // So we find all submitted quarters whose end date covers this transaction's date,
    // and check if the transaction existed before any of those submissions.
    const coveringQuarters = quarters.filter((q) =>
      q.isLocked &&
      q.quarterEnd >= transaction.date &&
      transaction.date >= (selectedYear?.start ?? "")
    );

    if (coveringQuarters.length === 0) return false;

    // Take the most recent submitted_at among all covering quarters
    // (handles amendments — Q2 amendment updates Q2's submitted_at)
    const latestSubmittedAt = coveringQuarters
      .map((q) => q.submission?.submitted_at ?? "")
      .sort()
      .reverse()[0];

    return transaction.created_at <= latestSubmittedAt;
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
      ["Date", "Description", "Type", "Amount"],
      ...toExport.sort((a, b) => a.date.localeCompare(b.date)).map((t) => [
        t.date, t.description ?? "", t.type === "income" ? "Income" : "Expense", Number(t.amount).toFixed(2),
      ]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${business?.name ?? "transactions"}_${selectedYear?.label ?? "all"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadUpload(upload: Upload) {
    const uploadTransactions = transactions
      .filter((t) => Number(t.upload_id) === Number(upload.id))
      .sort((a, b) => a.date.localeCompare(b.date));
    if (uploadTransactions.length === 0) return;
    const rows = [
      ["Date", "Description", "Type", "Amount"],
      ...uploadTransactions.map((t) => [
        t.date, t.description ?? "", t.type === "income" ? "Income" : "Expense", Number(t.amount).toFixed(2),
      ]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = formatUploadDownloadFilename(upload);
    a.click();
    URL.revokeObjectURL(url);
  }

  function prepareDeleteUpload(upload: Upload) {
    const uploadTx = transactions.filter((t) => Number(t.upload_id) === Number(upload.id));
    const submittedTx = uploadTx.filter((t) => isTransactionLocked(t));
    const submittedPeriodLabels = new Set<string>();
    for (const t of submittedTx) {
      const q = quarters.find((q) => q.isLocked && t.date >= q.quarterStart && t.date <= q.quarterEnd);
      if (q) submittedPeriodLabels.add(q.label.split(" ·")[0]);
    }
    const deletableTx = uploadTx.filter((t) => !isTransactionLocked(t));
    setDeleteUploadState({
      upload,
      submittedCount: submittedTx.length,
      deletableCount: deletableTx.length,
      submittedPeriods: Array.from(submittedPeriodLabels),
    });
  }

  async function confirmDeleteUpload() {
    if (!deleteUploadState) return;
    setDeleting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const uploadTx = transactions.filter((t) => Number(t.upload_id) === Number(deleteUploadState.upload.id));
      const deletableIds = uploadTx.filter((t) => !isTransactionLocked(t)).map((t) => t.id);

      if (deletableIds.length > 0) {
        for (let i = 0; i < deletableIds.length; i += 100) {
          const batch = deletableIds.slice(i, i + 100);
          await supabase.from("transactions").delete().in("id", batch).eq("user_id", user.id);
        }
        await supabase.from("uploads")
          .update({ deleted_count: (deleteUploadState.upload.deleted_count ?? 0) + deletableIds.length })
          .eq("id", deleteUploadState.upload.id)
          .eq("user_id", user.id);
      }

      setDeleteUploadState(null);
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  }

  async function handleFileSelect(file: File) {
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setStaging({ filename: file.name, validRows: [], duplicateCount: 0, invalidRows: [{ row: 0, reason: "File must be a CSV (.csv)" }], totalRows: 0 });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const text = await file.text();
    const allRows = parseCSV(text);
    if (allRows.length <= 1) {
      setStaging({ filename: file.name, validRows: [], duplicateCount: 0, invalidRows: [{ row: 0, reason: "File is empty or contains only a header row" }], totalRows: 0 });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const dataRows = allRows.slice(1).filter((r) => !r.every((c) => !c.trim()));
    const existingKeys = new Set(
      transactions.map((t) => `${t.date}|${(t.description ?? "").toLowerCase().trim()}|${t.type}|${Number(t.amount).toFixed(2)}`)
    );

    const validRows: ParsedRow[] = [];
    const invalidRows: InvalidRow[] = [];
    let duplicateCount = 0;
    const seenKeys = new Set<string>();

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const rowNum = i + 2;

      if (row.length < 4) {
        invalidRows.push({ row: rowNum, reason: `Row ${rowNum}: Not enough columns (expected Date, Description, Type, Amount)` });
        continue;
      }

      const dateResult = parseDate(row[0], rowNum);
      const typeResult = parseType(row[2], rowNum);
      const amountResult = parseAmount(row[3], rowNum);
      const description = row[1].trim();

      const errors: string[] = [];
      if (dateResult.error) errors.push(dateResult.error);
      if (typeResult.error) errors.push(typeResult.error);
      if (amountResult.error) errors.push(amountResult.error);

      if (errors.length > 0) {
        errors.forEach((e) => invalidRows.push({ row: rowNum, reason: e }));
        continue;
      }

      const key = `${dateResult.value}|${description.toLowerCase()}|${typeResult.value}|${amountResult.value!.toFixed(2)}`;
      if (existingKeys.has(key) || seenKeys.has(key)) { duplicateCount++; continue; }

      seenKeys.add(key);
      validRows.push({ date: dateResult.value!, description, type: typeResult.value!, amount: amountResult.value! });
    }

    setStaging({ filename: file.name, validRows, duplicateCount, invalidRows, totalRows: dataRows.length });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function confirmImport() {
    if (!staging || staging.validRows.length === 0) return;
    setConfirming(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data: uploadRecord, error: uploadError } = await supabase.from("uploads").insert({
        user_id: user.id,
        business_id: businessId,
        filename: staging.filename,
        total_rows: staging.totalRows,
        inserted_count: staging.validRows.length,
        duplicate_count: staging.duplicateCount,
        invalid_count: staging.invalidRows.length,
        deleted_count: 0,
      }).select("id").single();

      if (uploadError || !uploadRecord) throw uploadError ?? new Error("Failed to create upload record");

      for (let i = 0; i < staging.validRows.length; i += 500) {
        const batch = staging.validRows.slice(i, i + 500);
        const { error: insertError } = await supabase.from("transactions").insert(
          batch.map((r) => ({
            user_id: user.id,
            business_id: businessId,
            date: r.date,
            type: r.type,
            amount: r.amount,
            description: r.description || null,
            upload_id: uploadRecord.id,
          }))
        );
        if (insertError) throw insertError;
      }

      setStaging(null);
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setConfirming(false);
    }
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

          {/* Year + totals bar */}
          {availableYears.length > 0 && selectedYear ? (
            <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-[#B8D0EB] bg-[#CCE0F5] px-4 py-3">
              <div className="flex items-center gap-2">
                <label className="text-xs text-[#3B5A78]">Tax year</label>
                <select value={selectedYear.label} onChange={(e) => { setSelectedYearLabel(e.target.value); setFilterQuarter("all"); }} className="rounded-xl border border-[#B8D0EB] bg-white px-3 py-1.5 text-sm text-[#0F1C2E] outline-none transition focus:border-[#2E88D0]">
                  {availableYears.map((y) => <option key={y.label} value={y.label}>{y.label}</option>)}
                </select>
              </div>
              <div className="h-4 w-px bg-[#B8D0EB]" />
              <p className="text-xs font-semibold uppercase tracking-wide text-[#3B5A78]">Totals</p>
              <p className="text-xs text-[#3B5A78]">Income: <span className="font-medium text-[#0F1C2E]">{formatCurrency(annualTotals.income)}</span></p>
              <p className="text-xs text-[#3B5A78]">Expenses: <span className="font-medium text-[#0F1C2E]">{formatCurrency(annualTotals.expenses)}</span></p>
              <p className="text-xs text-[#3B5A78]">Net income: <span className={`font-medium ${annualTotals.income - annualTotals.expenses >= 0 ? "text-emerald-700" : "text-red-600"}`}>{formatCurrency(annualTotals.income - annualTotals.expenses)}</span></p>
              {isHmrcReady && loadingObligations ? <span className="ml-auto text-xs text-[#3B5A78]">Checking HMRC...</span> : null}
            </div>
          ) : null}

          {/* Quarterly cards */}
          {quarters.length > 0 && selectedYear ? (
            <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
          ) : null}

          {/* Transactions */}
          <div className="mt-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-medium text-[#0F1C2E]">
                Transactions
                {selectedYear ? <span className="ml-2 text-sm font-normal text-[#3B5A78]">{selectedYear.label}</span> : null}
              </h2>
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={exportTransactions} disabled={yearTransactions.length === 0} className="rounded-xl border border-[#B8D0EB] bg-[#DEE9F8] px-3 py-2 text-sm text-[#0F1C2E] transition hover:bg-[#B8D0EB] disabled:cursor-not-allowed disabled:opacity-40">Export CSV</button>
                <select value={filterType} onChange={(e) => setFilterType(e.target.value as "all" | "income" | "expense")} className="rounded-xl border border-[#B8D0EB] bg-white px-3 py-2 text-sm text-[#0F1C2E] outline-none transition focus:border-[#2E88D0]">
                  <option value="all">All types</option>
                  <option value="income">Income only</option>
                  <option value="expense">Expenses only</option>
                </select>
                <select value={filterQuarter} onChange={(e) => setFilterQuarter(e.target.value)} className="rounded-xl border border-[#B8D0EB] bg-white px-3 py-2 text-sm text-[#0F1C2E] outline-none transition focus:border-[#2E88D0]">
                  <option value="all">All quarters</option>
                  {quarters.map((q) => <option key={q.periodKey} value={q.periodKey}>{q.label}</option>)}
                </select>
                <input type="text" placeholder="Search..." value={filterSearch} onChange={(e) => setFilterSearch(e.target.value)} className="w-32 rounded-xl border border-[#B8D0EB] bg-white px-3 py-2 text-sm text-[#0F1C2E] outline-none transition placeholder:text-[#3B5A78] focus:border-[#2E88D0]" />
                {filterType !== "all" || filterQuarter !== "all" || filterSearch ? (
                  <button type="button" onClick={() => { setFilterType("all"); setFilterQuarter("all"); setFilterSearch(""); }} className="rounded-xl border border-[#B8D0EB] bg-[#DEE9F8] px-3 py-2 text-sm text-[#3B5A78] transition hover:bg-[#B8D0EB]">Clear</button>
                ) : null}
              </div>
            </div>

            <div className="mt-4 max-h-[240px] overflow-y-auto overflow-hidden rounded-2xl border border-[#B8D0EB]">
              {filteredTransactions.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-sm text-[#3B5A78]">{yearTransactions.length === 0 ? "No transactions yet. Upload a CSV file below to get started." : "No transactions match your filters."}</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="sticky top-0">
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
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {filteredTransactions.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-6 px-1">
                <p className="text-xs text-[#3B5A78]">{filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? "s" : ""}</p>
                <p className="text-xs text-[#3B5A78]">Income: <span className="font-medium text-[#0F1C2E]">{formatCurrency(filteredTransactions.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0))}</span></p>
                <p className="text-xs text-[#3B5A78]">Expenses: <span className="font-medium text-[#0F1C2E]">{formatCurrency(filteredTransactions.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0))}</span></p>
                <p className="text-xs text-[#3B5A78]">Net income: <span className="font-medium text-[#0F1C2E]">{formatCurrency(filteredTransactions.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0) - filteredTransactions.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0))}</span></p>
              </div>
            ) : null}

            {/* Upload section */}
            <div className="mt-6 rounded-2xl border border-[#B8D0EB] bg-[#CCE0F5] p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-[#0F1C2E]">Upload transactions</p>
                  <p className="mt-0.5 text-xs text-[#3B5A78]">CSV format: Date, Description, Type (income/expense), Amount · Transactions from 6 April 2025 onwards only</p>
                </div>
                <label htmlFor="csv-upload" className="cursor-pointer rounded-xl bg-[#2E88D0] px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90">
                  Choose CSV file
                </label>
                <input id="csv-upload" ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }} />
              </div>
            </div>

            {/* Upload history */}
            {uploads.length > 0 ? (
              <div className="mt-4">
                <p className="mb-3 text-xs font-medium uppercase tracking-wide text-[#3B5A78]">Upload history</p>
                <div className="overflow-hidden rounded-2xl border border-[#B8D0EB]">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[#CCE0F5] text-[#3B5A78] text-xs uppercase tracking-wide">
                        <th className="px-4 py-3 text-left font-semibold">File</th>
                        <th className="px-4 py-3 text-left font-semibold">Uploaded</th>
                        <th className="px-4 py-3 text-right font-semibold">Added</th>
                        <th className="px-4 py-3 text-right font-semibold">Active</th>
                        <th className="px-4 py-3 text-right font-semibold">Submitted</th>
                        <th className="px-4 py-3 text-right font-semibold">Deleted</th>
                        <th className="px-4 py-3" />
                      </tr>
                    </thead>
                    <tbody>
                      {uploads.map((u, i) => {
                        const uploadTx = transactions.filter((t) => Number(t.upload_id) === Number(u.id));
const submittedTx = uploadTx.filter((t) => isTransactionLocked(t));
const activeTx = uploadTx.filter((t) => !isTransactionLocked(t));
const hasActive = activeTx.length > 0;
                        return (
                          <tr key={u.id} className={i % 2 === 0 ? "bg-white" : "bg-[#f4f8fd]"}>
                            <td className="px-4 py-3 text-[#0F1C2E] text-xs">{u.filename}</td>
                            <td className="px-4 py-3 text-[#3B5A78] text-xs whitespace-nowrap">{formatDateTime(u.uploaded_at)}</td>
                            <td className="px-4 py-3 text-right text-xs font-medium text-[#0F1C2E]">{u.inserted_count}</td>
                            <td className="px-4 py-3 text-right text-xs font-medium text-emerald-700">{activeTx.length}</td>
                            <td className="px-4 py-3 text-right text-xs text-[#3B5A78]">{submittedTx.length}</td>
                            <td className="px-4 py-3 text-right text-xs text-[#3B5A78]">{u.deleted_count}</td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-3">
                                {uploadTx.length > 0 && u.inserted_count > 0 ? (
                                  <button type="button" onClick={() => downloadUpload(u)} className="text-xs text-[#2E88D0] transition hover:opacity-75">Download</button>
                                ) : null}
                                {hasActive ? (
                                  <button type="button" onClick={() => prepareDeleteUpload(u)} className="text-xs text-red-500 transition hover:text-red-700">Delete</button>
                                ) : null}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}
          </div>

        </section>
      </main>

      {staging ? (
        <StagingModal staging={staging} onConfirm={confirmImport} onCancel={() => setStaging(null)} confirming={confirming} />
      ) : null}

      {deleteUploadState ? (
        <DeleteUploadModal state={deleteUploadState} onConfirm={confirmDeleteUpload} onCancel={() => setDeleteUploadState(null)} deleting={deleting} />
      ) : null}
    </>
  );
}