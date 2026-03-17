"use client";

import Link from "next/link";
import { useMemo, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SiteShell } from "@/components/site-shell";
import { demoBusinesses, getDemoBusiness, type DemoBusiness, type DemoTransaction } from "@/data/demo-businesses";

// ─── Types ────────────────────────────────────────────────────────────────────

type Quarter = {
  label: string;
  quarterStart: string;
  quarterEnd: string;
  periodKey: string;
  income: number;
  expenses: number;
  transactionCount: number;
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
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function toInputDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function makePeriodKey(start: string, end: string) {
  return `${start}_${end}`;
}

function getTaxYearForDate(dateStr: string): TaxYear {
  const date = new Date(`${dateStr}T00:00:00`);
  const year = date.getFullYear();
  let yearEnd = new Date(year, 3, 5);
  if (date > yearEnd) yearEnd = new Date(year + 1, 3, 5);
  const yearStart = new Date(yearEnd);
  yearStart.setFullYear(yearStart.getFullYear() - 1);
  yearStart.setDate(yearStart.getDate() + 1);
  const startYear = yearStart.getFullYear();
  const endYear = yearEnd.getFullYear();
  return { label: `${startYear}–${String(endYear).slice(2)}`, start: toInputDate(yearStart), end: toInputDate(yearEnd) };
}

function getQuartersForTaxYear(taxYear: TaxYear): Omit<Quarter, "income" | "expenses" | "transactionCount">[] {
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

function deriveAvailableYears(transactions: DemoTransaction[]): TaxYear[] {
  const yearMap = new Map<string, TaxYear>();
  for (const t of transactions) {
    const ty = getTaxYearForDate(t.date);
    if (!yearMap.has(ty.label)) yearMap.set(ty.label, ty);
  }
  const today = toInputDate(new Date());
  const currentTy = getTaxYearForDate(today);
  if (!yearMap.has(currentTy.label)) yearMap.set(currentTy.label, currentTy);
  return Array.from(yearMap.values()).sort((a, b) => b.start.localeCompare(a.start));
}

function formatBusinessType(value: string) {
  if (value === "sole_trader") return "Sole trader";
  if (value === "uk_property") return "UK property";
  if (value === "overseas_property") return "Overseas property";
  return value;
}

function SortIndicator({ field, current, dir }: { field: SortField; current: SortField; dir: SortDir }) {
  if (field !== current) return <span className="ml-1 text-[#B8D0EB]">↕</span>;
  return <span className="ml-1 text-[#2E88D0]">{dir === "asc" ? "↑" : "↓"}</span>;
}

// ─── Business switcher ────────────────────────────────────────────────────────

function BusinessSwitcher({ currentId, onSwitch }: { currentId: string; onSwitch: (id: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {demoBusinesses.map((b) => (
        <button
          key={b.id}
          type="button"
          onClick={() => onSwitch(b.id)}
          className={`rounded-xl border px-3 py-1.5 text-xs transition ${b.id === currentId ? "border-[#2E88D0] bg-[#2E88D0] text-white" : "border-[#B8D0EB] bg-[#DEE9F8] text-[#3B5A78] hover:bg-[#CCE0F5] hover:text-[#0F1C2E]"}`}
        >
          {b.emoji} {b.name}
        </button>
      ))}
    </div>
  );
}

// ─── Sign up banner ───────────────────────────────────────────────────────────

function SignUpBanner() {
  return (
    <div className="rounded-2xl border border-[#2E88D0]/30 bg-[#2E88D0]/10 px-6 py-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[#0F1C2E]">Ready to submit your own returns?</p>
          <p className="mt-1 text-sm text-[#3B5A78]">Sign up free to connect your HMRC account and submit your quarterly updates.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/signup" className="rounded-xl bg-[#2E88D0] px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90">Sign up free →</Link>
          <Link href="/login" className="rounded-xl border border-[#B8D0EB] bg-white px-5 py-2.5 text-sm text-[#0F1C2E] transition hover:bg-[#DEE9F8]">Log in</Link>
        </div>
      </div>
    </div>
  );
}

// ─── Business view ────────────────────────────────────────────────────────────

function BusinessView({ business }: { business: DemoBusiness }) {
  const transactions = business.transactions;

  const [selectedYearLabel, setSelectedYearLabel] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");
  const [filterSearch, setFilterSearch] = useState("");
  const [filterQuarter, setFilterQuarter] = useState("all");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const availableYears = useMemo(() => deriveAvailableYears(transactions), [transactions]);

  const selectedYear = useMemo(() => {
    if (availableYears.length === 0) return null;
    if (selectedYearLabel) return availableYears.find((y) => y.label === selectedYearLabel) ?? availableYears[0];
    const yearsWithTx = availableYears.filter((y) => transactions.some((t) => t.date >= y.start && t.date <= y.end));
    return yearsWithTx.length > 0 ? yearsWithTx[0] : availableYears[0];
  }, [availableYears, selectedYearLabel, transactions]);

  const quarters: Quarter[] = useMemo(() => {
    if (!selectedYear) return [];
    return getQuartersForTaxYear(selectedYear).map((q) => {
      const qTx = transactions.filter((t) => t.date >= q.quarterStart && t.date <= q.quarterEnd);
      return {
        ...q,
        income: qTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0),
        expenses: qTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0),
        transactionCount: qTx.length,
      };
    });
  }, [selectedYear, transactions]);

  const annualTotals = useMemo(() => {
    if (!selectedYear) return { income: 0, expenses: 0 };
    const yt = transactions.filter((t) => t.date >= selectedYear.start && t.date <= selectedYear.end);
    return {
      income: yt.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0),
      expenses: yt.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0),
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
      else { valA = a.amount; valB = b.amount; }
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

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-2xl font-normal tracking-tight text-[#0F1C2E]">{business.emoji} {business.name}</h2>
        <span className="text-sm text-[#3B5A78]">{business.tagline}</span>
        <span className="rounded-full border border-[#B8D0EB] bg-[#DEE9F8] px-2.5 py-1 text-[11px] text-[#3B5A78]">{formatBusinessType(business.business_type)}</span>
      </div>

      {availableYears.length > 0 && selectedYear ? (
        <div className="mt-6 flex items-center gap-3">
          <label className="text-sm text-[#3B5A78]">Tax year</label>
          <select value={selectedYear.label} onChange={(e) => { setSelectedYearLabel(e.target.value); setFilterQuarter("all"); }} className="rounded-xl border border-[#B8D0EB] bg-white px-3 py-2 text-sm text-[#0F1C2E] outline-none transition focus:border-[#2E88D0]">
            {availableYears.map((y) => <option key={y.label} value={y.label}>{y.label}</option>)}
          </select>
        </div>
      ) : null}

      {quarters.length > 0 && selectedYear ? (
        <div className="mt-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {quarters.map((q) => (
              <div key={q.periodKey} className={`rounded-2xl border p-4 ${q.isFuture ? "border-[#B8D0EB] bg-[#DEE9F8] opacity-50" : q.isCurrent ? "border-[#2E88D0]/30 bg-[#CCE0F5]" : "border-amber-600/20 bg-amber-50"}`}>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#3B5A78]">{q.label}</p>
                  {!q.isFuture ? <span className="rounded-full border border-[#B8D0EB] bg-[#DEE9F8] px-2 py-0.5 text-[10px] text-[#3B5A78]">Estimate</span> : null}
                </div>
                <p className="mt-2 text-[11px] text-[#3B5A78]">{formatDate(q.quarterStart)} – {formatDate(q.quarterEnd)}</p>
                <div className="mt-3 space-y-1">
                  <p className="text-xs text-[#3B5A78]">Income: <span className="font-medium text-[#0F1C2E]">{formatCurrency(q.income)}</span></p>
                  <p className="text-xs text-[#3B5A78]">Expenses: <span className="font-medium text-[#0F1C2E]">{formatCurrency(q.expenses)}</span></p>
                  <p className="text-xs text-[#3B5A78]">Net income: <span className={`font-medium ${q.income - q.expenses >= 0 ? "text-emerald-700" : "text-red-600"}`}>{formatCurrency(q.income - q.expenses)}</span></p>
                </div>
                <p className="mt-2 text-[10px] text-[#3B5A78]">{q.transactionCount} transaction{q.transactionCount !== 1 ? "s" : ""}</p>
                {!q.isFuture ? (
                  <div className="mt-3">
                    <Link href="/signup" className="text-xs font-medium text-[#2E88D0] transition hover:opacity-75">Sign up to submit →</Link>
                  </div>
                ) : null}
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-2xl border border-[#B8D0EB] bg-[#CCE0F5] p-4">
            <div className="flex flex-wrap items-center gap-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#3B5A78]">{selectedYear.label} estimated totals</p>
              <p className="text-xs text-[#3B5A78]">Income: <span className="font-medium text-[#0F1C2E]">{formatCurrency(annualTotals.income)}</span></p>
              <p className="text-xs text-[#3B5A78]">Expenses: <span className="font-medium text-[#0F1C2E]">{formatCurrency(annualTotals.expenses)}</span></p>
              <p className="text-xs text-[#3B5A78]">Net income: <span className={`font-medium ${annualTotals.income - annualTotals.expenses >= 0 ? "text-emerald-700" : "text-red-600"}`}>{formatCurrency(annualTotals.income - annualTotals.expenses)}</span></p>
            </div>
          </div>

          <div className="mt-4"><SignUpBanner /></div>
        </div>
      ) : null}

      <div className="mt-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-lg font-medium text-[#0F1C2E]">
            Transactions
            {selectedYear ? <span className="ml-2 text-sm font-normal text-[#3B5A78]">{selectedYear.label}</span> : null}
          </h2>
        </div>

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

        <div className="mt-4 overflow-hidden rounded-2xl border border-[#B8D0EB]">
          {filteredTransactions.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-[#3B5A78]">No transactions match your filters.</p>
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
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((t, i) => (
                  <tr key={t.id} className={i % 2 === 0 ? "bg-white" : "bg-[#f4f8fd]"}>
                    <td className="px-5 py-3 text-[#3B5A78] whitespace-nowrap">{formatDate(t.date)}</td>
                    <td className="px-5 py-3 text-[#0F1C2E]">{t.description || <span className="text-[#3B5A78]">—</span>}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${t.type === "income" ? "bg-emerald-50 text-emerald-700 border border-emerald-600/20" : "bg-amber-50 text-amber-700 border border-amber-600/20"}`}>
                        {t.type === "income" ? "Income" : "Expense"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right font-medium text-[#0F1C2E]">{formatCurrency(t.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {filteredTransactions.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-6 px-1">
            <p className="text-xs text-[#3B5A78]">{filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? "s" : ""}</p>
            <p className="text-xs text-[#3B5A78]">Income: <span className="font-medium text-[#0F1C2E]">{formatCurrency(filteredTransactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0))}</span></p>
            <p className="text-xs text-[#3B5A78]">Expenses: <span className="font-medium text-[#0F1C2E]">{formatCurrency(filteredTransactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0))}</span></p>
            <p className="text-xs text-[#3B5A78]">Net income: <span className="font-medium text-[#0F1C2E]">{formatCurrency(filteredTransactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0) - filteredTransactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0))}</span></p>
          </div>
        ) : null}

        <div className="mt-8"><SignUpBanner /></div>
      </div>
    </div>
  );
}

// ─── Main demo page ───────────────────────────────────────────────────────────

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
    <SiteShell>
      <section className="mx-auto w-full max-w-[1000px] px-6 py-10 sm:px-8 lg:px-10">
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-[#2E88D0]/30 bg-[#2E88D0]/10 px-5 py-3">
          <span className="shrink-0 rounded-full bg-[#2E88D0] px-2.5 py-0.5 text-xs font-semibold text-white">DEMO</span>
          <p className="text-sm text-[#0F1C2E]">These are example businesses with fictional data. Nothing is connected to HMRC.</p>
          <Link href="/" className="ml-auto shrink-0 text-xs text-[#3B5A78] transition hover:text-[#0F1C2E]">← Back</Link>
        </div>
        <div className="mb-6">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-[#3B5A78]">Switch business</p>
          <BusinessSwitcher currentId={selectedId} onSwitch={handleSwitch} />
        </div>
        <BusinessView key={selectedId} business={business} />
      </section>
    </SiteShell>
  );
}

export default function DemoPage() {
  return (
    <Suspense fallback={
      <SiteShell>
        <section className="mx-auto w-full max-w-[1000px] px-6 py-10 sm:px-8 lg:px-10">
          <p className="text-sm text-[#3B5A78]">Loading...</p>
        </section>
      </SiteShell>
    }>
      <DemoPageInner />
    </Suspense>
  );
}