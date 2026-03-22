"use client";

import Link from "next/link";
import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { demoBusinesses, getBusinessTurnover } from "@/data/demo-businesses";
import * as XLSX from "xlsx";

// ─── Types ────────────────────────────────────────────────────────────────────

type SheetData = { name: string; rows: (string | number | null)[][] };
type UploadStep = "idle" | "picking" | "confirm";
type PickTarget = "turnover" | "expenses";

// ─── FAQs ─────────────────────────────────────────────────────────────────────

const faqs = [
  { q: "What is Making Tax Digital for Income Tax?", a: "From 6 April 2026, sole traders and landlords earning over £50,000 must keep digital records and submit quarterly updates to HMRC using compatible software. Instead of doing everything in one annual rush, you'll send summary figures four times a year." },
  { q: "Do I have to stop using my spreadsheet?", a: "No. Flonancial is bridging software — it connects your existing spreadsheet to HMRC. You keep your records exactly as you do now. When it's time to submit, upload your file and pick the cells containing your turnover and expenses. That's it." },
  { q: "What is the Flo tab?", a: "If you download our free template, it includes a Flo tab with two cells — Turnover and Expenses — already linked to formulas. When you upload, Flonancial reads these automatically so you skip the cell-picking step. You don't need a Flo tab if you use your own spreadsheet — it just makes things faster." },
  { q: "What about the Final Declaration?", a: "Flonancial handles quarterly updates only. For the year-end Final Declaration, you can use HMRC's own online service or another compatible product. This is a common approach — several HMRC-recognised bridging tools work the same way." },
  { q: "Is Flonancial free?", a: "Yes — Flonancial is free for individuals and always will be. No card required, no hidden fees. In future we plan to offer paid plans for accountants managing multiple clients, but if you're a sole trader or landlord filing your own returns, it's free." },
  { q: "Is my data safe?", a: "Yes. Your spreadsheet is parsed entirely in your browser — the file never touches our servers. We only store the summary figures you submit to HMRC (turnover, expenses, and any other business income). We use HMRC's official OAuth process to connect to your tax account, so we never see or store your HMRC password. We use essential cookies only — no tracking, no advertising, no analytics — which is why you won't see a cookie banner." },
  { q: "Do I need an accountant?", a: "Not necessarily. Flonancial is designed for straightforward sole trader and landlord cases where you already keep decent records. If your affairs are more complex, it's still sensible to get advice from a qualified accountant." },
  { q: "What if the £50,000 threshold drops?", a: "HMRC has confirmed the threshold will drop to £30,000 from April 2027 and to £20,000 from April 2028. Flonancial is being built to support those future thresholds too." },
  { q: "What does HMRC actually receive?", a: "Three numbers per quarterly update: your turnover, your expenses, and any other business income (usually zero). HMRC never sees individual transactions. The record-keeping obligation — keeping the detail of every transaction — sits with you, the taxpayer, not the software." },
];

// ─── Small components ─────────────────────────────────────────────────────────

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-[#B8D0EB]/60">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between py-4 text-left text-sm font-medium text-[#0F1C2E] transition hover:text-[#2E88D0]">
        <span>{q}</span>
        <span className="ml-4 shrink-0 text-[#2E4A63]">{open ? "−" : "+"}</span>
      </button>
      {open ? <p className="pb-4 text-sm leading-6 text-[#2E4A63]">{a}</p> : null}
    </div>
  );
}

function TrustBadge({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-[#B8D0EB]/60 bg-white/70 px-4 py-2 backdrop-blur-sm">
      {icon}
      <span className="text-sm font-medium text-[#0F1C2E]">{label}</span>
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
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 2 }).format(value);
}

function formatCurrencyShort(value: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(value);
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function HomePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploadStep, setUploadStep] = useState<UploadStep>("idle");
  const [filename, setFilename] = useState("");
  const [sheets, setSheets] = useState<SheetData[]>([]);
  const [activeSheet, setActiveSheet] = useState(0);
  const [pickTarget, setPickTarget] = useState<PickTarget>("turnover");
  const [selectedTurnoverCell, setSelectedTurnoverCell] = useState<string | null>(null);
  const [selectedExpensesCell, setSelectedExpensesCell] = useState<string | null>(null);
  const [turnover, setTurnover] = useState(0);
  const [expenses, setExpenses] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const parseNumber = (val: unknown): number | null => {
    if (val == null || val === "") return null;
    if (typeof val === "number") return Math.round(val * 100) / 100;
    const cleaned = String(val).replace(/[£$€,\s]/g, "");
    const num = parseFloat(cleaned);
    if (!Number.isFinite(num) || num < 0) return null;
    return Math.round(num * 100) / 100;
  };

  const parseWorkbook = useCallback((file: File) => {
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        if (!wb.SheetNames.length) { setError("This file has no sheets."); return; }

        const parsed: SheetData[] = wb.SheetNames.map((name) => {
          const ws = wb.Sheets[name];
          const json = XLSX.utils.sheet_to_json<(string | number | null)[]>(ws, { header: 1, defval: null, blankrows: false });
          return { name, rows: json };
        });

        setSheets(parsed);
        setFilename(file.name);

        const floIndex = parsed.findIndex((s) => s.name.toLowerCase() === "flo");
        if (floIndex !== -1) {
          const floSheet = parsed[floIndex];
          const rawTurnover = floSheet.rows[0]?.[1];
          const rawExpenses = floSheet.rows[1]?.[1];
          const t = parseNumber(rawTurnover);
          const ex = parseNumber(rawExpenses);
          if (t !== null && ex !== null) {
            setTurnover(t);
            setExpenses(ex);
            setUploadStep("confirm");
            return;
          }
          setError("Found a Flo tab but couldn't read the values. Please click on the correct cells below.");
        }

        setActiveSheet(floIndex !== -1 ? floIndex : 0);
        setPickTarget("turnover");
        setSelectedTurnoverCell(null);
        setSelectedExpensesCell(null);
        setUploadStep("picking");
      } catch {
        setError("Could not read this file. Please check it's a valid spreadsheet (.xlsx, .xls, .csv, or .ods).");
      }
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const handleFile = (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["xlsx", "xls", "csv", "ods", "numbers"].includes(ext ?? "")) {
      setError("Please upload a spreadsheet file (.xlsx, .xls, .csv, or .ods).");
      return;
    }
    parseWorkbook(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, []);

  const handleCellClick = (rowIdx: number, colIdx: number) => {
    const sheet = sheets[activeSheet];
    if (!sheet) return;
    const val = sheet.rows[rowIdx]?.[colIdx];
    const num = parseNumber(val);
    const cellRef = `${XLSX.utils.encode_col(colIdx)}${rowIdx + 1}`;

    if (num === null) {
      setError(`Cell ${cellRef} doesn't contain a valid number.`);
      return;
    }
    setError(null);

    if (pickTarget === "turnover") {
      setTurnover(num);
      setSelectedTurnoverCell(`${sheet.name}!${cellRef}`);
      setPickTarget("expenses");
    } else {
      setExpenses(num);
      setSelectedExpensesCell(`${sheet.name}!${cellRef}`);
      setUploadStep("confirm");
    }
  };

  const resetAll = () => {
    setUploadStep("idle");
    setFilename("");
    setSheets([]);
    setTurnover(0);
    setExpenses(0);
    setSelectedTurnoverCell(null);
    setSelectedExpensesCell(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleConfirm = () => {
    try {
      sessionStorage.setItem("flo_prefill", JSON.stringify({ turnover, expenses }));
    } catch {}
    router.push("/preview");
  };

  const isUploading = uploadStep !== "idle";

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#E8F0FA] via-[#F0F5FB] to-white text-[#0F1C2E]">
      <img src="/wave3.png" alt="" aria-hidden="true" className="pointer-events-none absolute left-1/2 top-0 z-0 w-[1400px] max-w-none -translate-x-1/2 opacity-[0.25]" style={{ maskImage: "linear-gradient(to bottom, black 90%, transparent 100%)", WebkitMaskImage: "linear-gradient(to bottom, black 90%, transparent 100%)" }} />
      <img src="/wave2.png" alt="" aria-hidden="true" className="pointer-events-none absolute left-1/2 top-[800px] z-0 w-[1400px] max-w-none -translate-x-1/2 opacity-[0.06]" style={{ maskImage: "linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)", WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)" }} />
      <img src="/wave.png" alt="" aria-hidden="true" className="pointer-events-none absolute left-1/2 top-[1600px] z-0 w-[1400px] max-w-none -translate-x-1/2 opacity-[0.06]" style={{ maskImage: "linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)", WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)" }} />
      <img src="/wave2.png" alt="" aria-hidden="true" className="pointer-events-none absolute left-1/2 top-[2400px] z-0 w-[1400px] max-w-none -translate-x-1/2 opacity-[0.06]" style={{ maskImage: "linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)", WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)" }} />
      <SiteHeader />

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative pb-4 pt-8">
        <div className="relative z-10 mx-auto w-full max-w-[1000px] px-6 sm:px-8 lg:px-10">
          <div className="text-center">
            <h1 className="text-[2.2rem] font-bold leading-[1.05] tracking-[-0.03em] text-[#0F1C2E] sm:text-[2.8rem] lg:text-[3.4rem]">
              Free & Simple MTD for Income Tax
            </h1>
            <p className="mx-auto mt-5 max-w-[800px] text-base leading-7 text-[#2E4A63]">
              Trusted bridging software for Making Tax Digital. Securely upload your spreadsheet, review your figures, and submit quarterly updates directly to HMRC. Built for sole traders and UK landlords.
            </p>

          </div>
        </div>
      </section>

      {/* ── Main content ──────────────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-[1000px] px-6 sm:px-8 lg:px-10">

        {/* ── Step 1 card ─────────────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-3xl border border-[#B8D0EB]/70 bg-white/50 shadow-xl shadow-[#B8D0EB]/20 backdrop-blur-sm">
          <div className="relative z-10 px-6 py-8 sm:px-10">

            {/* Step header */}
            <div className="flex items-center justify-center gap-3">
              <span className="inline-flex shrink-0 items-center justify-center rounded-full bg-[#2E88D0] px-3.5 py-1.5 text-xs font-bold text-white shadow-md shadow-[#2E88D0]/20">Step 1</span>
              <h2 className="text-xl font-semibold text-[#0F1C2E]">{isUploading ? "Review your figures" : "Upload your spreadsheet"}</h2>
            </div>

            {/* ── IDLE: Three columns ────── */}
            {uploadStep === "idle" ? (
              <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
                {/* Column 1 — Upload */}
                <div className="text-center sm:px-6">
                  <h3 className="text-base font-semibold text-[#0F1C2E]">Already have a spreadsheet?</h3>
                  <p className="mt-2 text-sm leading-6 text-[#2E4A63]">
                    Upload it now — your file is parsed in your browser and never leaves your device.
                  </p>
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    className={`mt-4 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-8 transition ${
                      dragOver ? "border-[#2E88D0] bg-[#2E88D0]/5" : "border-[#B8D0EB] bg-white/60"
                    }`}
                  >
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-[#2E4A63]">
                      <path d="M4 14V18C4 19.1046 4.89543 20 6 20H18C19.1046 20 20 19.1046 20 18V14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      <path d="M12 15V4M12 4L8 8M12 4L16 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <p className="mt-2 text-sm text-[#2E4A63]">Drag & drop or</p>
                    <label
                      htmlFor="landing-upload"
                      className="mt-3 cursor-pointer rounded-xl bg-[#2E88D0] px-5 py-2.5 text-sm font-medium text-white shadow-md shadow-[#2E88D0]/20 transition hover:shadow-lg hover:shadow-[#2E88D0]/30"
                    >
                      Choose file
                    </label>
                    <input
                      id="landing-upload"
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls,.csv,.ods,.numbers"
                      className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                    />
                    <p className="mt-2 text-[11px] text-[#2E4A63]">.xlsx, .xls, .csv, or .ods</p>
                  </div>
                  {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
                </div>

                {/* Column 2 — Template */}
                <div className="text-center sm:border-x sm:border-[#B8D0EB]/40 sm:px-6">
                  <h3 className="text-base font-semibold text-[#0F1C2E]">Don&apos;t use a spreadsheet yet?</h3>
                  <p className="mt-2 text-sm leading-6 text-[#2E4A63]">
                    Download our free template. Enter your transactions — the <strong className="text-[#0F1C2E]">Flo</strong> tab auto-calculates everything HMRC needs.
                  </p>
                  <a
                    href="/flonancial_template.xlsx"
                    download="flonancial_template.xlsx"
                    className="mt-4 inline-block rounded-xl border border-[#2E88D0] bg-white px-5 py-2.5 text-sm font-medium text-[#2E88D0] shadow-sm transition hover:bg-[#2E88D0] hover:text-white hover:shadow-md"
                  >
                    Download Free Template
                  </a>
                  <p className="mt-3 text-xs font-medium text-[#2E88D0]">Then come back and upload</p>
                </div>

                {/* Column 3 — Other tools (Google Sheets etc.) */}
                <div className="text-center sm:px-6">
                  <h3 className="text-base font-semibold text-[#0F1C2E]">Using something else like Google Sheets?</h3>
                  <p className="mt-2 text-sm leading-6 text-[#2E4A63]">
                    Export or download as .xlsx, then come back and upload.
                  </p>
                  <div className="mt-6 flex flex-col items-center gap-3">
                    <img src="/swap.png" alt="Export and re-upload" width={144} height={144} className="opacity-100" />
                    <p className="text-xs font-medium text-[#2E88D0]">Then come back and upload</p>
                  </div>
                </div>
              </div>
            ) : null}

            {/* ── PICKING: Cell picker ──────────────────────────────────── */}
            {uploadStep === "picking" ? (
              <div className="mt-4">
                <p className="text-sm font-medium text-[#0F1C2E]">{filename}</p>

                <div className={`mt-3 rounded-xl px-4 py-3 ${pickTarget === "turnover" ? "border border-[#2E88D0]/30 bg-blue-50" : "border border-emerald-600/20 bg-emerald-50"}`}>
                  <p className="text-sm font-medium text-[#0F1C2E]">
                    {pickTarget === "turnover" ? "Click the cell containing your total turnover (income)" : "Now click the cell containing your total expenses"}
                  </p>
                  {selectedTurnoverCell ? (
                    <p className="mt-1 text-xs text-[#2E4A63]">
                      Turnover: <span className="font-medium text-[#0F1C2E]">{formatCurrency(turnover)}</span>
                      <span className="ml-1">({selectedTurnoverCell})</span>
                    </p>
                  ) : null}
                </div>

                {sheets.length > 1 ? (
                  <div className="mt-3 flex gap-1 overflow-x-auto">
                    {sheets.map((s, i) => (
                      <button
                        key={s.name}
                        onClick={() => setActiveSheet(i)}
                        className={`shrink-0 rounded-t-lg px-3 py-1.5 text-xs font-medium transition ${
                          i === activeSheet ? "border border-b-0 border-[#B8D0EB] bg-white text-[#0F1C2E]" : "bg-[#DEE9F8] text-[#2E4A63] hover:bg-white/50"
                        } ${s.name.toLowerCase() === "flo" ? "font-semibold text-[#2E88D0]" : ""}`}
                      >
                        {s.name}
                      </button>
                    ))}
                  </div>
                ) : null}

                {(() => {
                  const sheet = sheets[activeSheet];
                  const maxCols = Math.min(sheet?.rows.reduce((max, r) => Math.max(max, r.length), 0) ?? 0, 20);
                  const maxRows = Math.min(sheet?.rows.length ?? 0, 200);
                  return (
                    <div className="mt-1 max-h-[360px] overflow-auto rounded-b-xl border border-[#B8D0EB] bg-white">
                      {sheet && maxRows > 0 ? (
                        <table className="w-full border-collapse text-xs">
                          <thead className="sticky top-0 z-10">
                            <tr className="bg-[#DEE9F8]">
                              <th className="w-8 border-b border-r border-[#B8D0EB] px-2 py-1.5 text-center text-[10px] font-medium text-[#2E4A63]" />
                              {Array.from({ length: maxCols }, (_, c) => (
                                <th key={c} className="min-w-[80px] border-b border-r border-[#B8D0EB] px-2 py-1.5 text-center text-[10px] font-medium text-[#2E4A63]">
                                  {XLSX.utils.encode_col(c)}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {sheet.rows.slice(0, maxRows).map((row, rIdx) => (
                              <tr key={rIdx} className="hover:bg-blue-50/30">
                                <td className="border-b border-r border-[#B8D0EB] bg-[#DEE9F8] px-2 py-1 text-center text-[10px] font-medium text-[#2E4A63]">{rIdx + 1}</td>
                                {Array.from({ length: maxCols }, (_, cIdx) => {
                                  const val = row[cIdx];
                                  const cellRef = `${sheet.name}!${XLSX.utils.encode_col(cIdx)}${rIdx + 1}`;
                                  const isSelTurnover = selectedTurnoverCell === cellRef;
                                  const isSelExpenses = selectedExpensesCell === cellRef;
                                  const isNumeric = val != null && parseNumber(val) !== null;
                                  return (
                                    <td
                                      key={cIdx}
                                      onClick={() => handleCellClick(rIdx, cIdx)}
                                      className={`cursor-pointer whitespace-nowrap border-b border-r border-[#B8D0EB] px-2 py-1 transition ${
                                        isSelTurnover ? "bg-blue-100 ring-2 ring-inset ring-[#2E88D0]" :
                                        isSelExpenses ? "bg-emerald-100 ring-2 ring-inset ring-emerald-500" :
                                        isNumeric ? "hover:bg-blue-50" : "hover:bg-gray-50"
                                      } ${isNumeric ? "font-medium text-[#0F1C2E]" : "text-[#2E4A63]"}`}
                                    >
                                      {val != null ? String(val) : ""}
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <p className="p-6 text-center text-sm text-[#2E4A63]">This sheet is empty.</p>
                      )}
                    </div>
                  );
                })()}

                {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

                <div className="mt-4 flex flex-wrap gap-3">
                  {selectedTurnoverCell ? (
                    <button type="button" onClick={() => { setPickTarget("turnover"); setSelectedTurnoverCell(null); setSelectedExpensesCell(null); setError(null); }} className="rounded-xl border border-[#B8D0EB] bg-white px-4 py-2 text-sm text-[#0F1C2E] transition hover:bg-[#DEE9F8]">
                      Start over
                    </button>
                  ) : null}
                  <button type="button" onClick={resetAll} className="rounded-xl border border-[#B8D0EB] bg-white px-4 py-2 text-sm text-[#2E4A63] transition hover:bg-[#DEE9F8]">
                    Cancel
                  </button>
                </div>

                <p className="mt-3 text-[11px] text-[#2E4A63]">Your file is parsed in your browser — it never leaves your device.</p>
              </div>
            ) : null}

            {/* ── CONFIRM: Show figures ──────────────────────────────── */}
            {uploadStep === "confirm" ? (
              <div className="mt-4">
                <p className="text-sm text-[#2E4A63]">
                  {filename} {selectedTurnoverCell ? "(manually selected)" : "(read from Flo tab)"}
                </p>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-[#B8D0EB] bg-white px-5 py-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-[#2E4A63]">Turnover</p>
                    <p className="mt-1 text-2xl font-semibold text-[#0F1C2E]">{formatCurrency(turnover)}</p>
                  </div>
                  <div className="rounded-xl border border-[#B8D0EB] bg-white px-5 py-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-[#2E4A63]">Expenses</p>
                    <p className="mt-1 text-2xl font-semibold text-[#0F1C2E]">{formatCurrency(expenses)}</p>
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-emerald-600/20 bg-emerald-50 px-5 py-4 text-center">
                  <p className="text-sm font-medium text-emerald-700">These are the figures Flonancial would submit to HMRC.</p>
                  <p className="mt-1 text-xs text-emerald-600">We&apos;ll show you what your Flonancial dashboard looks like with these figures.</p>
                  <button
                    type="button"
                    onClick={handleConfirm}
                    className="mt-4 rounded-xl bg-[#2E88D0] px-6 py-2.5 text-sm font-medium text-white shadow-md shadow-[#2E88D0]/20 transition hover:shadow-lg"
                  >
                    Confirm & see your dashboard →
                  </button>
                  <p className="mt-2 text-[11px] text-emerald-600">Free · No card required</p>
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  <button type="button" onClick={() => { setUploadStep("idle"); setError(null); }} className="rounded-xl border border-[#B8D0EB] bg-white px-4 py-2 text-sm text-[#2E4A63] transition hover:bg-[#DEE9F8]">
                    ← Try a different file
                  </button>
                </div>

                <p className="mt-3 text-[11px] text-[#2E4A63]">Your file was parsed in your browser — it never left your device.</p>
              </div>
            ) : null}

          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          <TrustBadge
            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 2L3 7V12C3 17.55 6.84 22.74 12 24C17.16 22.74 21 17.55 21 12V7L12 2Z" fill="#2E88D0" opacity="0.15" /><path d="M10 16.5L6 12.5L7.41 11.09L10 13.67L16.59 7.09L18 8.5L10 16.5Z" fill="#2E88D0" /></svg>}
            label="Secure & encrypted"
          />
          <TrustBadge
            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1Z" fill="#10B981" opacity="0.2" /><path d="M10 16L6 12L7.4 10.6L10 13.2L16.6 6.6L18 8L10 16Z" fill="#10B981" /></svg>}
            label="GDPR compliant"
          />
        </div>

        {/* ── Steps 2, 3, 4 ──────────────────────────────────────── */}
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {[
            { step: "Step 2", title: "Connect to HMRC", text: "Authorise securely with your Government Gateway account. One-time setup — connection is valid for 18 months." },
            { step: "Step 3", title: "Review your figures", text: "Check your outstanding HMRC obligations and double check your figures before anything is submitted." },
            { step: "Step 4", title: "Submit to HMRC", text: "Confirm and submit your quarterly update directly. Your cumulative figures are sent — ensure you keep your records safe." },
          ].map(({ step, title, text }) => (
            <div key={title} className="rounded-2xl border border-[#B8D0EB]/60 bg-white p-6 text-center shadow-sm">
              <span className="inline-flex items-center justify-center rounded-full bg-[#2E88D0] px-3 py-1 text-xs font-bold text-white">{step}</span>
              <p className="mt-3 text-sm font-semibold text-[#0F1C2E]">{title}</p>
              <p className="mt-2 text-sm leading-6 text-[#2E4A63]">{text}</p>
            </div>
          ))}
        </div>

        {/* ── See how it looks ─────────────────────────────────────── */}
        <div className="mt-12">
          <div className="text-center">
            <h2 className="text-2xl font-bold tracking-tight text-[#0F1C2E]">See how it looks</h2>
            <p className="mt-2 text-sm text-[#2E4A63]">Choose an example business to see how Flonancial works:</p>
          </div>
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {demoBusinesses.slice(0, 4).map((b) => {
              const bTurnover = getBusinessTurnover(b);
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => router.push(`/demo?business=${b.id}`)}
                  className="group rounded-2xl border border-[#B8D0EB]/60 bg-white p-4 text-left shadow-sm transition hover:border-[#2E88D0] hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[#0F1C2E]">{b.emoji} {b.name}</p>
                      <p className="mt-0.5 text-xs text-[#2E4A63]">{b.tagline}</p>
                      <span className="mt-2 inline-block rounded-full border border-[#B8D0EB]/60 bg-[#F0F5FB] px-2 py-0.5 text-[10px] text-[#2E4A63]">
                        {formatBusinessType(b.business_type)}
                      </span>
                      <p className="mt-3 text-xs text-[#2E4A63]">
                        <span className="font-semibold text-[#0F1C2E]">{formatCurrencyShort(bTurnover)}</span> annual turnover
                      </p>
                    </div>
                    <span className="shrink-0 text-sm text-[#B8D0EB] transition group-hover:text-[#2E88D0]">→</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Built for sole traders ───────────────────────────────── */}
        <div className="mt-12 rounded-3xl border border-[#B8D0EB]/60 bg-white px-8 py-8 shadow-sm">
          <h2 className="text-xl font-bold text-[#0F1C2E]">Built for sole traders and UK landlords</h2>
          <ul className="mt-5 space-y-3">
            {[
              "Pure bridging software — we read your turnover and expenses and submit them to HMRC",
              "Your spreadsheet is parsed in your browser. The file never touches our servers.",
              "We only store the summary figures you submit — no transactions, no spreadsheet data",
              "Keep your records in your spreadsheet exactly as you do now",
              "Designed for sole traders and UK property landlords earning under £90,000",
              "Secure HMRC connection via official OAuth — we never see your HMRC password",
              "Operated by Flonancial Ltd (Company No. 17090724)",
            ].map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm leading-6 text-[#2E4A63]">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs text-emerald-600">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* ── FAQ ──────────────────────────────────────────────────── */}
        <div className="mt-12 rounded-3xl border border-[#B8D0EB]/60 bg-white px-8 py-8 shadow-sm">
          <h2 className="text-xl font-bold text-[#0F1C2E]">Frequently asked questions</h2>
          <div className="mt-4">
            {faqs.map((faq) => <FaqItem key={faq.q} q={faq.q} a={faq.a} />)}
          </div>
        </div>

        {/* ── CTA ──────────────────────────────────────────────────── */}
        <div className="mt-12 overflow-hidden rounded-3xl bg-gradient-to-r from-[#2E88D0] to-[#1a6db5] px-8 py-12 text-center shadow-lg">
          <h2 className="text-2xl font-bold text-white">Ready to submit?</h2>
          <p className="mx-auto mt-3 max-w-[440px] text-sm leading-6 text-white/80">
            Create your free account, connect to HMRC to find your business, and submit your first quarterly update.
          </p>
          <Link href="/signup" className="mt-6 inline-block rounded-xl bg-white px-7 py-3 text-sm font-semibold text-[#2E88D0] shadow-md transition hover:shadow-lg">Create your free account</Link>
          <p className="mt-3 text-xs text-white/60">Free · No card required</p>
        </div>

      </section>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <footer className="mt-16 border-t border-[#B8D0EB]/40">
        <div className="mx-auto w-full max-w-[1000px] px-6 sm:px-8 lg:px-10">
          <div className="flex flex-col gap-4 py-8 text-sm text-[#2E4A63] sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} Flonancial Ltd</p>
            <div className="flex flex-wrap gap-6">
              <Link href="/dashboard" className="hover:text-[#0F1C2E]">Dashboard</Link>
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
