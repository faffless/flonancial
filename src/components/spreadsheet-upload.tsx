"use client";

import { useState, useCallback, useRef } from "react";
import * as XLSX from "xlsx";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ExtractedFigures = {
  turnover: number;
  expenses: number;
  otherIncome: number;
};

type SheetData = {
  name: string;
  rows: (string | number | null)[][];
};

type Step = "idle" | "picking" | "confirm";
type PickTarget = "turnover" | "expenses";

// ─── Component ────────────────────────────────────────────────────────────────

export function SpreadsheetUpload({
  onSubmit,
  onCancel,
  submitting,
  quarterLabel,
}: {
  onSubmit: (figures: ExtractedFigures) => void;
  onCancel: () => void;
  submitting: boolean;
  quarterLabel: string;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("idle");
  const [filename, setFilename] = useState("");
  const [sheets, setSheets] = useState<SheetData[]>([]);
  const [activeSheet, setActiveSheet] = useState(0);
  const [pickTarget, setPickTarget] = useState<PickTarget>("turnover");
  const [selectedTurnoverCell, setSelectedTurnoverCell] = useState<string | null>(null);
  const [selectedExpensesCell, setSelectedExpensesCell] = useState<string | null>(null);
  const [figures, setFigures] = useState<ExtractedFigures>({ turnover: 0, expenses: 0, otherIncome: 0 });
  const [editingOther, setEditingOther] = useState(false);
  const [otherInputValue, setOtherInputValue] = useState("0");
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

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

        if (!wb.SheetNames.length) {
          setError("This file has no sheets.");
          return;
        }

        // Parse all sheets into arrays
        const parsed: SheetData[] = wb.SheetNames.map((name) => {
          const ws = wb.Sheets[name];
          const json = XLSX.utils.sheet_to_json<(string | number | null)[]>(ws, {
            header: 1,
            defval: null,
            blankrows: false,
          });
          return { name, rows: json };
        });

        setSheets(parsed);
        setFilename(file.name);

        // Look for Flo tab (case-insensitive)
        const floIndex = parsed.findIndex((s) => s.name.toLowerCase() === "flo");

        if (floIndex !== -1) {
          const floSheet = parsed[floIndex];
          // Read B1 for turnover, B2 for expenses (0-indexed: row 0 col 1, row 1 col 1)
          const rawTurnover = floSheet.rows[0]?.[1];
          const rawExpenses = floSheet.rows[1]?.[1];
          const turnover = parseNumber(rawTurnover);
          const expenses = parseNumber(rawExpenses);

          if (turnover !== null && expenses !== null) {
            // Auto-detected — go straight to confirmation
            setFigures({ turnover, expenses, otherIncome: 0 });
            setStep("confirm");
            return;
          }
          // Flo tab exists but values aren't right — fall through to picker
          setError("Found a Flo tab but couldn't read the turnover and expenses values. Please click on the correct cells below.");
        }

        // No Flo tab or bad values — show cell picker
        setActiveSheet(floIndex !== -1 ? floIndex : 0);
        setPickTarget("turnover");
        setSelectedTurnoverCell(null);
        setSelectedExpensesCell(null);
        setStep("picking");
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
      setError(`Cell ${cellRef} doesn't contain a valid number. Please click a cell with a numeric value.`);
      return;
    }

    setError(null);

    if (pickTarget === "turnover") {
      setFigures((f) => ({ ...f, turnover: num }));
      setSelectedTurnoverCell(`${sheet.name}!${cellRef}`);
      setPickTarget("expenses");
    } else {
      setFigures((f) => ({ ...f, expenses: num }));
      setSelectedExpensesCell(`${sheet.name}!${cellRef}`);
      // Both picked — go to confirmation
      setStep("confirm");
    }
  };

  const resetPicker = () => {
    setPickTarget("turnover");
    setSelectedTurnoverCell(null);
    setSelectedExpensesCell(null);
    setError(null);
  };

  const resetAll = () => {
    setStep("idle");
    setFilename("");
    setSheets([]);
    setFigures({ turnover: 0, expenses: 0, otherIncome: 0 });
    setSelectedTurnoverCell(null);
    setSelectedExpensesCell(null);
    setError(null);
    setEditingOther(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 2 }).format(val);

  // ─── Idle: Drop zone ──────────────────────────────────────────────────────

  if (step === "idle") {
    return (
      <div className="rounded-2xl border border-[#B8D0EB] bg-[#CCE0F5] p-6">
        <p className="text-sm font-medium text-[#0F1C2E]">Upload & submit — {quarterLabel}</p>
        <p className="mt-1 text-xs text-[#2E4A63]">
          Upload your spreadsheet and choose the relevant cells. If it has a <strong className="text-[#0F1C2E]">Flo</strong> tab, your figures will be read automatically.
        </p>

        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`mt-4 flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 transition ${
            dragOver ? "border-[#2E88D0] bg-white/50" : "border-[#B8D0EB] bg-white/30"
          }`}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-[#2E4A63]">
            <path d="M4 14V18C4 19.1046 4.89543 20 6 20H18C19.1046 20 20 19.1046 20 18V14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M12 15V4M12 4L8 8M12 4L16 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p className="mt-3 text-sm text-[#2E4A63]">Drag and drop your spreadsheet here</p>
          <p className="mt-1 text-xs text-[#2E4A63]">.xlsx, .xls, .csv, or .ods</p>
          <label
            htmlFor="spreadsheet-upload"
            className="mt-4 cursor-pointer rounded-xl bg-[#2E88D0] px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
          >
            Choose file
          </label>
          <input
            id="spreadsheet-upload"
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv,.ods,.numbers"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
        </div>

        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

        <div className="mt-4 flex gap-3">
          <button type="button" onClick={onCancel} className="rounded-xl border border-[#B8D0EB] bg-[#DEE9F8] px-4 py-2 text-sm text-[#0F1C2E] transition hover:bg-[#B8D0EB]">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // ─── Cell picker ──────────────────────────────────────────────────────────

  if (step === "picking") {
    const sheet = sheets[activeSheet];
    const maxCols = Math.min(sheet?.rows.reduce((max, r) => Math.max(max, r.length), 0) ?? 0, 20);
    const maxRows = Math.min(sheet?.rows.length ?? 0, 200);

    return (
      <div className="rounded-2xl border border-[#B8D0EB] bg-[#CCE0F5] p-6">
        <p className="text-sm font-medium text-[#0F1C2E]">{filename}</p>

        {/* Instruction banner */}
        <div className={`mt-3 rounded-xl px-4 py-3 ${pickTarget === "turnover" ? "border border-[#2E88D0]/30 bg-blue-50" : "border border-emerald-600/20 bg-emerald-50"}`}>
          <p className="text-sm font-medium text-[#0F1C2E]">
            {pickTarget === "turnover" ? "Step 1: Click the cell containing your total turnover (income)" : "Step 2: Click the cell containing your total expenses"}
          </p>
          {selectedTurnoverCell ? (
            <p className="mt-1 text-xs text-[#2E4A63]">
              Turnover: <span className="font-medium text-[#0F1C2E]">{formatCurrency(figures.turnover)}</span>
              <span className="ml-1 text-[#2E4A63]">({selectedTurnoverCell})</span>
            </p>
          ) : null}
        </div>

        {/* Sheet tabs */}
        {sheets.length > 1 ? (
          <div className="mt-3 flex gap-1 overflow-x-auto">
            {sheets.map((s, i) => (
              <button
                key={s.name}
                onClick={() => setActiveSheet(i)}
                className={`shrink-0 rounded-t-lg px-3 py-1.5 text-xs font-medium transition ${
                  i === activeSheet ? "bg-white text-[#0F1C2E] border border-b-0 border-[#B8D0EB]" : "bg-[#DEE9F8] text-[#2E4A63] hover:bg-white/50"
                } ${s.name.toLowerCase() === "flo" ? "text-[#2E88D0] font-semibold" : ""}`}
              >
                {s.name}
              </button>
            ))}
          </div>
        ) : null}

        {/* Spreadsheet grid */}
        <div className="mt-1 max-h-[360px] overflow-auto rounded-b-xl border border-[#B8D0EB] bg-white">
          {sheet && maxRows > 0 ? (
            <table className="w-full border-collapse text-xs">
              <thead className="sticky top-0 z-10">
                <tr className="bg-[#DEE9F8]">
                  <th scope="col" className="border-r border-b border-[#B8D0EB] px-2 py-1.5 text-center text-[10px] font-medium text-[#2E4A63] w-8" />
                  {Array.from({ length: maxCols }, (_, c) => (
                    <th key={c} scope="col" className="border-r border-b border-[#B8D0EB] px-2 py-1.5 text-center text-[10px] font-medium text-[#2E4A63] min-w-[80px]">
                      {XLSX.utils.encode_col(c)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sheet.rows.slice(0, maxRows).map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-blue-50/30">
                    <td className="border-r border-b border-[#B8D0EB] bg-[#DEE9F8] px-2 py-1 text-center text-[10px] font-medium text-[#2E4A63]">
                      {rIdx + 1}
                    </td>
                    {Array.from({ length: maxCols }, (_, cIdx) => {
                      const val = row[cIdx];
                      const cellRef = `${sheet.name}!${XLSX.utils.encode_col(cIdx)}${rIdx + 1}`;
                      const isSelectedTurnover = selectedTurnoverCell === cellRef;
                      const isSelectedExpenses = selectedExpensesCell === cellRef;
                      const isNumeric = val != null && parseNumber(val) !== null;

                      return (
                        <td
                          key={cIdx}
                          role="button"
                          tabIndex={0}
                          aria-label={`Cell ${cellRef}${val != null ? `, value: ${val}` : ""}`}
                          onClick={() => handleCellClick(rIdx, cIdx)}
                          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleCellClick(rIdx, cIdx); } }}
                          className={`border-r border-b border-[#B8D0EB] px-2 py-1 cursor-pointer transition whitespace-nowrap ${
                            isSelectedTurnover ? "bg-blue-100 ring-2 ring-inset ring-[#2E88D0]" :
                            isSelectedExpenses ? "bg-emerald-100 ring-2 ring-inset ring-emerald-500" :
                            isNumeric ? "hover:bg-blue-50" : "hover:bg-gray-50"
                          } ${isNumeric ? "text-[#0F1C2E] font-medium" : "text-[#2E4A63]"}`}
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

        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

        <div className="mt-4 flex flex-wrap gap-3">
          {selectedTurnoverCell ? (
            <button type="button" onClick={resetPicker} className="rounded-xl border border-[#B8D0EB] bg-[#DEE9F8] px-4 py-2 text-sm text-[#0F1C2E] transition hover:bg-[#B8D0EB]">
              Start over
            </button>
          ) : null}
          <button type="button" onClick={resetAll} className="rounded-xl border border-[#B8D0EB] bg-[#DEE9F8] px-4 py-2 text-sm text-[#2E4A63] transition hover:bg-[#B8D0EB]">
            Cancel — choose a different file
          </button>
        </div>
      </div>
    );
  }

  // ─── Confirmation screen ──────────────────────────────────────────────────

  return (
    <div className="rounded-2xl border border-[#B8D0EB] bg-[#CCE0F5] p-6">
      <p className="text-sm font-medium text-[#0F1C2E]">Confirm your figures — {quarterLabel}</p>
      <p className="mt-1 text-xs text-[#2E4A63]">
        {filename} {selectedTurnoverCell ? `(manually selected)` : `(read from Flo tab)`}
      </p>

      <div className="mt-4 space-y-3">
        {/* Turnover */}
        <div className="flex items-center justify-between rounded-xl border border-[#B8D0EB] bg-white px-5 py-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-[#2E4A63]">Turnover</p>
            <p className="text-xs text-[#2E4A63]">Your total business income year-to-date</p>
          </div>
          <p className="text-xl font-semibold text-[#0F1C2E]">{formatCurrency(figures.turnover)}</p>
        </div>

        {/* Expenses */}
        <div className="flex items-center justify-between rounded-xl border border-[#B8D0EB] bg-white px-5 py-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-[#2E4A63]">Expenses</p>
            <p className="text-xs text-[#2E4A63]">Your total allowable expenses year-to-date</p>
          </div>
          <p className="text-xl font-semibold text-[#0F1C2E]">{formatCurrency(figures.expenses)}</p>
        </div>

        {/* Other business income */}
        <div className="flex items-center justify-between rounded-xl border border-[#B8D0EB] bg-white px-5 py-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-[#2E4A63]">Other business income</p>
            <p className="text-xs text-[#2E4A63] flex items-center gap-1.5">
              Grants, insurance payouts etc. — most sole traders and landlords leave this as £0. 
              <span className="group relative">
                <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#B8D0EB] text-[9px] font-bold text-[#2E4A63] cursor-help">?</span>
                <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-56 -translate-x-1/2 rounded-lg border border-[#B8D0EB] bg-white px-3 py-2 text-[11px] leading-4 text-[#2E4A63] opacity-0 shadow-lg transition group-hover:opacity-100">
                  This covers things like business grants, insurance payouts for business losses, or government support payments. Please consult an accountant if you're unsure whether this applies to you.Presently, Flonancial doesn't allow this £0 to be edited - if you do need a different value declared within other business income, please email us at hello@flonancial.co.uk and we&apos;ll help.
                </span>
              </span>
            </p>
          </div>
          <p className="text-xl font-semibold text-[#0F1C2E]">{formatCurrency(figures.otherIncome)}</p>
        </div>
      </div>

      {/* Summary */}
      <div className="mt-4 rounded-xl border border-emerald-600/20 bg-emerald-50 px-5 py-3">
        <p className="text-xs text-[#2E4A63]">
          These cumulative year-to-date figures will be submitted to HMRC. This submission replaces any previous update for this tax year.
        </p>
      </div>

<label className="mt-4 flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-[#B8D0EB] accent-[#2E88D0]"
                />
                <span className="text-sm text-[#0F1C2E]">I confirm these figures are correct to the best of my knowledge</span>
              </label>

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => onSubmit(figures)}
          disabled={submitting || !confirmed}
          className="rounded-xl bg-[#2E88D0] px-6 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
        >
          {submitting ? "Submitting to HMRC..." : "Submit to HMRC"}
        </button>
        <button
          type="button"
          onClick={() => { setStep("idle"); setError(null); }}
          disabled={submitting}
          className="rounded-xl border border-[#B8D0EB] bg-[#DEE9F8] px-4 py-2.5 text-sm text-[#0F1C2E] transition hover:bg-[#B8D0EB] disabled:opacity-60"
        >
          Back — choose a different file
        </button>
        <button
          type="button"
          onClick={() => { resetAll(); onCancel(); }}
          disabled={submitting}
          className="rounded-xl border border-[#B8D0EB] bg-[#DEE9F8] px-4 py-2.5 text-sm text-[#2E4A63] transition hover:bg-[#B8D0EB] disabled:opacity-60"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
