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
  { q: "Do I have to stop using my spreadsheet?", a: "No. Flonancial is bridging software — it connects your existing spreadsheet to HMRC. You keep your records exactly as you do now. When it's time to submit, upload your file and Flonancial reads just the two numbers HMRC needs: your turnover and your expenses." },
  { q: "What is the Flo tab?", a: "The Flo tab is a simple tab in your spreadsheet with two cells: Turnover and Expenses. If you use our free template, it's already set up with formulas. If you have your own spreadsheet, you add a Flo tab and link it to your existing totals. When you upload, Flonancial reads this tab automatically." },
  { q: "What about the Final Declaration?", a: "Flonancial handles quarterly updates only. For the year-end Final Declaration, you can use HMRC's own online service or another compatible product. This is a common approach — several HMRC-recognised bridging tools work the same way." },
  { q: "Is Flonancial free?", a: "Yes — Flonancial is completely free during beta. No card required. We'll give plenty of notice before introducing any paid plans." },
  { q: "Is my data safe?", a: "Yes. Your spreadsheet is parsed entirely in your browser — the file never touches our servers. We only store the summary figures you submit to HMRC (turnover, expenses, and any other business income). We use HMRC's official OAuth process to connect to your tax account, so we never see or store your HMRC password." },
  { q: "Do I need an accountant?", a: "Not necessarily. Flonancial is designed for straightforward sole trader and landlord cases where you already keep decent records. If your affairs are more complex, it's still sensible to get advice from a qualified accountant." },
  { q: "What if the £50,000 threshold drops?", a: "HMRC has confirmed the threshold will drop to £30,000 from April 2027 and to £20,000 from April 2028. Flonancial is being built to support those future thresholds too." },
  { q: "What does HMRC actually receive?", a: "Just three numbers per quarterly update: your turnover, any other business income (usually zero), and a single total for all your expenses. HMRC never sees individual transactions. The record-keeping obligation — keeping the detail of every transaction — sits with you, the taxpayer, not the software." },
];

// ─── Ribbon arrow SVG ─────────────────────────────────────────────────────────

function RibbonArrowLeft({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 40" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M18 20L34 8V15H72C74.2 15 76 16.8 76 19V21C76 23.2 74.2 25 72 25H34V32L18 20Z" fill="#2E88D0" opacity="0.15" />
      <path d="M14 20L30 8V14H68C69.1 14 70 14.9 70 16V24C70 25.1 69.1 26 68 26H30V32L14 20Z" fill="#2E88D0" opacity="0.3" />
      <path d="M10 20L26 10V16H64C64.6 16 65 16.4 65 17V23C65 23.6 64.6 24 64 24H26V30L10 20Z" fill="#2E88D0" />
    </svg>
  );
}

function RibbonArrowUp({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 60" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M20 10L8 26H15V52C15 53.1 15.9 54 17 54H23C24.1 54 25 53.1 25 52V26H32L20 10Z" fill="#2E88D0" opacity="0.15" />
      <path d="M20 6L8 22H14V48C14 48.6 14.4 49 15 49H25C25.6 49 26 48.6 26 48V22H32L20 6Z" fill="#2E88D0" opacity="0.3" />
      <path d="M20 2L10 16H16V44C16 44.6 16.4 45 17 45H23C23.6 45 24 44.6 24 44V16H30L20 2Z" fill="#2E88D0" />
    </svg>
  );
}

// ─── Small components ─────────────────────────────────────────────────────────

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
    <main className="min-h-screen text-[#0F1C2E]">
      <SiteHeader />
      <section className="mx-auto w-full max-w-[1000px] px-6 py-4 sm:px-8 lg:px-10">

        {/* ── Title — plain background ──────────────────────────────── */}
        <div className="text-center">
          <h1 className="text-[1.8rem] font-semibold leading-[1.08] tracking-[-0.04em] text-[#0F1C2E] sm:text-[2.2rem] lg:text-[2.6rem]">
            Free & Simple MTD for Income Tax
          </h1>
          <p className="mx-auto mt-3 max-w-[840px] text-sm leading-6 text-[#3B5A78]">
            Flonancial is bridging software for Making Tax Digital. Upload your spreadsheet, review your figures,<br />and submit quarterly updates directly to HMRC. Built for sole traders and UK landlords earning less than £90,000.
          </p>
        </div>

        {/* ── Step 1 — wave background ─────────────────────────────── */}
        <div className="relative mt-6 overflow-hidden rounded-[28px] border border-[#B8D0EB] bg-[#CCE0F5]">
          <img src="/wave.png" alt="" className="pointer-events-none absolute bottom-[-60px] left-1/2 z-0 w-[980px] max-w-none -translate-x-1/2 opacity-[0.05]" />
          <div className="relative z-10 px-6 py-6 sm:px-8">

            {/* Step 1 header */}
            <div className="flex items-center justify-center gap-3">
              <span className="inline-flex shrink-0 items-center justify-center rounded-full bg-[#2E88D0] px-3 py-1 text-xs font-bold text-white">Step 1</span>
              <h3 className="text-lg font-semibold text-[#0F1C2E]">{isUploading ? "Review your figures" : "Upload your spreadsheet"}</h3>
            </div>

            {/* ── IDLE: Upload + guidance ────── */}
            {uploadStep === "idle" ? (
              <div className="mt-5 grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-0">
                {/* LEFT — Upload */}
                <div className="p-5 text-center">
                  <h4 className="text-base font-semibold text-[#0F1C2E]">Already have a spreadsheet?</h4>
                  <p className="mt-2 text-sm leading-6 text-[#3B5A78]">
                    Upload it now — your file is parsed in your browser and never leaves your device.
                  </p>

                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    className={`mt-4 flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-8 transition ${
                      dragOver ? "border-[#2E88D0] bg-white/50" : "border-[#B8D0EB] bg-white/30"
                    }`}
                  >
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-[#3B5A78]">
                      <path d="M4 14V18C4 19.1046 4.89543 20 6 20H18C19.1046 20 20 19.1046 20 18V14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      <path d="M12 15V4M12 4L8 8M12 4L16 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <p className="mt-2 text-sm text-[#3B5A78]">Drag & drop or</p>
                    <label
                      htmlFor="landing-upload"
                      className="mt-2 cursor-pointer rounded-xl bg-[#2E88D0] px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
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
                    <p className="mt-2 text-[11px] text-[#3B5A78]">.xlsx, .xls, .csv, or .ods</p>
                  </div>

                  {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
                </div>

                {/* Vertical divider (desktop) */}
                <div className="hidden sm:flex flex-col items-center py-5">
                  <div className="w-px flex-1 bg-[#B8D0EB]" />
                </div>

                {/* Horizontal divider (mobile) */}
                <div className="sm:hidden mx-5">
                  <div className="h-px w-full bg-[#B8D0EB]" />
                </div>

                {/* RIGHT — Google Sheets + Template */}
                <div className="p-5 text-center">
                  {/* Google Sheets */}
                  <h4 className="text-base font-semibold text-[#0F1C2E]">Using Google Sheets?</h4>
                  <p className="mt-2 text-sm leading-6 text-[#3B5A78]">
                    Copy to your Drive, download as .xlsx
                  </p>
                  <div className="mt-3 flex items-center justify-center gap-3">
                    <RibbonArrowLeft className="hidden sm:block h-8 w-16" />
                    <RibbonArrowUp className="sm:hidden h-10 w-8" />
                    <p className="text-xs font-medium text-[#2E88D0]">Then come back and upload</p>
                  </div>

                  {/* Divider between the two right sections */}
                  <div className="my-5 mx-auto w-3/4 h-px bg-[#B8D0EB]" />

                  {/* Template download */}
                  <h4 className="text-base font-semibold text-[#0F1C2E]">Don&apos;t use a spreadsheet yet?</h4>
                  <p className="mt-2 text-sm leading-6 text-[#3B5A78]">
                    Download our free template. Enter your transactions — the <strong className="text-[#0F1C2E]">Flo</strong> tab auto-calculates everything HMRC needs.
                  </p>
                  <a href="/flonancial_template.xlsx" download="flonancial_template.xlsx" className="mt-4 inline-block rounded-xl bg-[#2E88D0] px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90">
                    Download Template (.xlsx)
                  </a>
                  <div className="mt-4 flex items-center justify-center gap-3">
                    <RibbonArrowLeft className="hidden sm:block h-8 w-16" />
                    <RibbonArrowUp className="sm:hidden h-10 w-8" />
                    <p className="text-xs font-medium text-[#2E88D0]">Then come back and upload</p>
                  </div>
                </div>
              </div>
            ) : null}

{/* ── PICKING: Cell picker (full width) ──────────────── */}
            {uploadStep === "picking" ? (
              <div className="mt-4">
                <p className="text-sm font-medium text-[#0F1C2E]">{filename}</p>

                <div className={`mt-3 rounded-xl px-4 py-3 ${pickTarget === "turnover" ? "border border-[#2E88D0]/30 bg-blue-50" : "border border-emerald-600/20 bg-emerald-50"}`}>
                  <p className="text-sm font-medium text-[#0F1C2E]">
                    {pickTarget === "turnover" ? "Click the cell containing your total turnover (income)" : "Now click the cell containing your total expenses"}
                  </p>
                  {selectedTurnoverCell ? (
                    <p className="mt-1 text-xs text-[#3B5A78]">
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
                          i === activeSheet ? "border border-b-0 border-[#B8D0EB] bg-white text-[#0F1C2E]" : "bg-[#DEE9F8] text-[#3B5A78] hover:bg-white/50"
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
                              <th className="w-8 border-b border-r border-[#B8D0EB] px-2 py-1.5 text-center text-[10px] font-medium text-[#3B5A78]" />
                              {Array.from({ length: maxCols }, (_, c) => (
                                <th key={c} className="min-w-[80px] border-b border-r border-[#B8D0EB] px-2 py-1.5 text-center text-[10px] font-medium text-[#3B5A78]">
                                  {XLSX.utils.encode_col(c)}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {sheet.rows.slice(0, maxRows).map((row, rIdx) => (
                              <tr key={rIdx} className="hover:bg-blue-50/30">
                                <td className="border-b border-r border-[#B8D0EB] bg-[#DEE9F8] px-2 py-1 text-center text-[10px] font-medium text-[#3B5A78]">{rIdx + 1}</td>
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
                                      } ${isNumeric ? "font-medium text-[#0F1C2E]" : "text-[#3B5A78]"}`}
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
                        <p className="p-6 text-center text-sm text-[#3B5A78]">This sheet is empty.</p>
                      )}
                    </div>
                  );
                })()}

                {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

                <div className="mt-4 flex flex-wrap gap-3">
                  {selectedTurnoverCell ? (
                    <button type="button" onClick={() => { setPickTarget("turnover"); setSelectedTurnoverCell(null); setSelectedExpensesCell(null); setError(null); }} className="rounded-xl border border-[#B8D0EB] bg-[#DEE9F8] px-4 py-2 text-sm text-[#0F1C2E] transition hover:bg-[#B8D0EB]">
                      Start over
                    </button>
                  ) : null}
                  <button type="button" onClick={resetAll} className="rounded-xl border border-[#B8D0EB] bg-[#DEE9F8] px-4 py-2 text-sm text-[#3B5A78] transition hover:bg-[#B8D0EB]">
                    Cancel
                  </button>
                </div>

                <p className="mt-3 text-[11px] text-[#3B5A78]">Your file is parsed in your browser — it never leaves your device.</p>
              </div>
            ) : null}

            {/* ── CONFIRM: Show figures ───────────────────────────── */}
            {uploadStep === "confirm" ? (
              <div className="mt-4">
                <p className="text-sm text-[#3B5A78]">
                  {filename} {selectedTurnoverCell ? "(manually selected)" : "(read from Flo tab)"}
                </p>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-[#B8D0EB] bg-white px-5 py-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-[#3B5A78]">Turnover</p>
                    <p className="mt-1 text-2xl font-semibold text-[#0F1C2E]">{formatCurrency(turnover)}</p>
                  </div>
                  <div className="rounded-xl border border-[#B8D0EB] bg-white px-5 py-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-[#3B5A78]">Expenses</p>
                    <p className="mt-1 text-2xl font-semibold text-[#0F1C2E]">{formatCurrency(expenses)}</p>
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-emerald-600/20 bg-emerald-50 px-5 py-4 text-center">
                  <p className="text-sm font-medium text-emerald-700">These are the figures Flonancial would submit to HMRC.</p>
                  <p className="mt-1 text-xs text-emerald-600">We&apos;ll show you what your Flonancial dashboard looks like with these figures.</p>
                  <button
                    type="button"
                    onClick={handleConfirm}
                    className="mt-4 rounded-xl bg-[#2E88D0] px-6 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
                  >
                    Confirm & see your dashboard →
                  </button>
                  <p className="mt-2 text-[11px] text-emerald-600">Free · No card required</p>
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  <button type="button" onClick={() => { setUploadStep("idle"); setError(null); }} className="rounded-xl border border-[#B8D0EB] bg-[#DEE9F8] px-4 py-2 text-sm text-[#3B5A78] transition hover:bg-[#B8D0EB]">
                    ← Try a different file
                  </button>
                </div>

                <p className="mt-3 text-[11px] text-[#3B5A78]">Your file was parsed in your browser — it never left your device.</p>
              </div>
            ) : null}

          </div>
        </div>

        {/* ── Steps 2, 3, 4 ──────────────────────────────────────── */}
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            { step: "Step 2", title: "Connect to HMRC", text: "Authorise securely with your Government Gateway account. One-time setup — connection is valid for 18 months." },
            { step: "Step 3", title: "Review your figures", text: "Check your outstanding HMRC obligatinons and double check your figures before anything is submitted" },
            { step: "Step 4", title: "Submit to HMRC", text: "Confirm and submit your quarterly update directly. Your cumulative figures are sent — Ensure you keep your records safe" },
          ].map(({ step, title, text }) => (
            <div key={title} className="rounded-2xl border border-[#B8D0EB] bg-[#CCE0F5] p-5 text-center">
              <span className="inline-flex items-center justify-center rounded-full bg-[#2E88D0] px-3 py-1 text-xs font-bold text-white">{step}</span>
              <p className="mt-3 text-sm font-medium text-[#0F1C2E]">{title}</p>
              <p className="mt-2 text-sm leading-6 text-[#3B5A78]">{text}</p>
            </div>
          ))}
        </div>

        {/* See how it looks */}
        <div className="mt-8">
          <div className="text-center">
            <h2 className="text-2xl font-semibold tracking-tight text-[#0F1C2E]">See how it looks</h2>
            <p className="mt-2 text-sm text-[#3B5A78]">Choose an example business to see how Flonancial works:</p>
          </div>
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {demoBusinesses.slice(0, 4).map((b) => {
              const bTurnover = getBusinessTurnover(b);
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
                        <span className="font-semibold text-[#0F1C2E]">{formatCurrencyShort(bTurnover)}</span> annual turnover
                      </p>
                    </div>
                    <span className="shrink-0 text-sm text-[#B8D0EB]">→</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Built for sole traders and UK landlords */}
        <div className="relative mt-8 overflow-hidden rounded-2xl border border-[#B8D0EB] bg-[#CCE0F5] px-8 py-8">
          <img src="/wave.png" alt="" className="pointer-events-none absolute bottom-[-60px] left-1/2 z-0 w-[980px] max-w-none -translate-x-1/2 opacity-[0.05]" />
          <div className="relative z-10">
            <h2 className="text-lg font-semibold text-[#0F1C2E]">Built for sole traders and UK landlords</h2>
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
          <p className="mt-3 text-xs leading-5 text-[#3B5A78]">Free · No card required</p>
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
