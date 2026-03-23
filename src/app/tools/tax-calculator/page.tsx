"use client";

import { useState } from "react";
import Link from "next/link";
import { SiteShell } from "@/components/site-shell";
import {
  calculateFullTax,
  type EmploymentType,
  type StudentLoanPlan,
  type TaxResult,
} from "@/components/tax-estimate";

function fmt(n: number) {
  return n.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtShort(n: number) {
  return n.toLocaleString("en-GB", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function ResultRow({ label, value, bold, accent }: { label: string; value: number; bold?: boolean; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className={`text-xs ${bold ? "font-semibold text-[#0F1C2E]" : "text-[#2E4A63]"}`}>{label}</span>
      <span className={`text-xs font-medium ${accent ? "text-[#2E88D0]" : bold ? "font-semibold text-[#0F1C2E]" : "text-[#0F1C2E]"}`}>
        £{fmt(value)}
      </span>
    </div>
  );
}

const STUDENT_LOAN_OPTIONS: { value: StudentLoanPlan; label: string }[] = [
  { value: "plan1", label: "Plan 1 (before Sept 2012)" },
  { value: "plan2", label: "Plan 2 (Sept 2012 onwards)" },
  { value: "plan4", label: "Plan 4 (Scottish)" },
  { value: "plan5", label: "Plan 5 (Sept 2023 onwards)" },
  { value: "postgrad", label: "Postgraduate loan" },
];

export default function TaxCalculatorPage() {
  const [employmentType, setEmploymentType] = useState<EmploymentType>("employed");
  const [income, setIncome] = useState("");
  const [expenses, setExpenses] = useState("");
  const [studentLoans, setStudentLoans] = useState<StudentLoanPlan[]>([]);
  const [pensionPercent, setPensionPercent] = useState("");
  const [taxCode, setTaxCode] = useState("");
  const [marriageAllowance, setMarriageAllowance] = useState(false);
  const [blindPersonsAllowance, setBlindPersonsAllowance] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const incomeNum = parseFloat(income) || 0;
  const expensesNum = parseFloat(expenses) || 0;
  const pensionNum = parseFloat(pensionPercent) || 0;

  const profit = employmentType === "self-employed" ? incomeNum - expensesNum : incomeNum;
  const hasInput = incomeNum > 0;
  const isLoss = employmentType === "self-employed" && expensesNum > 0 && profit <= 0;

  let result: TaxResult | null = null;
  if (hasInput && profit > 0) {
    result = calculateFullTax({
      income: incomeNum,
      expenses: expensesNum,
      employmentType,
      studentLoans,
      pensionPercent: pensionNum,
      taxCode,
      marriageAllowance,
      blindPersonsAllowance,
    });
  }

  function toggleStudentLoan(plan: StudentLoanPlan) {
    setStudentLoans((prev) =>
      prev.includes(plan) ? prev.filter((p) => p !== plan) : [...prev, plan]
    );
  }

  return (
    <SiteShell>
      <section className="mx-auto w-full max-w-[960px] px-6 py-5">
        <h1 className="text-xl font-semibold tracking-tight text-[#0F1C2E]">UK Tax Calculator 2025–26</h1>
        <p className="mt-1 text-xs text-[#2E4A63]">
          Income tax, National Insurance, student loans, pension — employed or self-employed.
        </p>

        <div className="mt-4 grid gap-5 lg:grid-cols-2">
          {/* ── Left: inputs ────────────────────────────────────────── */}
          <div className="space-y-3">
            <div className="rounded-xl border border-[#B8D0EB] bg-white p-4">
              {/* Employment type toggle */}
              <div>
                <p className="text-xs font-medium text-[#0F1C2E]">I am</p>
                <div className="mt-1.5 flex gap-1.5">
                  {([["employed", "Employed"], ["self-employed", "Self-employed"]] as const).map(([val, label]) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setEmploymentType(val)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                        employmentType === val
                          ? "bg-[#2E88D0] text-white"
                          : "border border-[#B8D0EB] bg-[#F0F5FB] text-[#2E4A63] hover:bg-[#DEE9F8]"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Income */}
              <div className="mt-3">
                <label htmlFor="income" className="block text-xs font-medium text-[#0F1C2E]">
                  {employmentType === "employed" ? "Annual salary (gross)" : "Annual income (turnover)"}
                </label>
                <div className="relative mt-1">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-[#5A7A9B]">£</span>
                  <input id="income" type="number" min="0" step="1" value={income} onChange={(e) => setIncome(e.target.value)} placeholder={employmentType === "employed" ? "e.g. 35000" : "e.g. 55000"} className="w-full rounded-lg border border-[#B8D0EB] bg-[#F0F5FB] py-2 pl-6 pr-3 text-xs text-[#0F1C2E] outline-none transition focus:border-[#2E88D0] focus:ring-1 focus:ring-[#2E88D0]" />
                </div>
              </div>

              {/* Expenses (self-employed only) */}
              {employmentType === "self-employed" && (
                <div className="mt-2.5">
                  <label htmlFor="expenses" className="block text-xs font-medium text-[#0F1C2E]">Annual expenses</label>
                  <div className="relative mt-1">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-[#5A7A9B]">£</span>
                    <input id="expenses" type="number" min="0" step="1" value={expenses} onChange={(e) => setExpenses(e.target.value)} placeholder="e.g. 8000" className="w-full rounded-lg border border-[#B8D0EB] bg-[#F0F5FB] py-2 pl-6 pr-3 text-xs text-[#0F1C2E] outline-none transition focus:border-[#2E88D0] focus:ring-1 focus:ring-[#2E88D0]" />
                  </div>
                </div>
              )}

              {/* Pension */}
              <div className="mt-2.5">
                <label htmlFor="pension" className="block text-xs font-medium text-[#0F1C2E]">Pension %</label>
                <div className="relative mt-1">
                  <input id="pension" type="number" min="0" max="100" step="1" value={pensionPercent} onChange={(e) => setPensionPercent(e.target.value)} placeholder={employmentType === "employed" ? "e.g. 5" : "e.g. 0"} className="w-full rounded-lg border border-[#B8D0EB] bg-[#F0F5FB] py-2 px-2.5 pr-7 text-xs text-[#0F1C2E] outline-none transition focus:border-[#2E88D0] focus:ring-1 focus:ring-[#2E88D0]" />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#5A7A9B]">%</span>
                </div>
              </div>

              {/* Student loans — checkboxes for multiple */}
              <div className="mt-3">
                <p className="text-xs font-medium text-[#0F1C2E]">Student loans</p>
                <div className="mt-1 space-y-0.5">
                  {STUDENT_LOAN_OPTIONS.map((opt) => (
                    <label key={opt.value} className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 transition hover:bg-[#F0F5FB]">
                      <input
                        type="checkbox"
                        checked={studentLoans.includes(opt.value)}
                        onChange={() => toggleStudentLoan(opt.value)}
                        className="h-3.5 w-3.5 rounded border-[#B8D0EB] text-[#2E88D0] focus:ring-[#2E88D0]"
                      />
                      <span className="text-xs text-[#2E4A63]">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Advanced options */}
            <div className="rounded-xl border border-[#B8D0EB] bg-white p-4">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex w-full items-center justify-between text-xs font-medium text-[#0F1C2E]"
              >
                <span>Advanced options</span>
                <span className="text-[10px] text-[#5A7A9B]">{showAdvanced ? "Hide" : "Show"}</span>
              </button>

              {showAdvanced && (
                <div className="mt-3 space-y-3">
                  {/* Tax code */}
                  <div>
                    <label htmlFor="tax-code" className="block text-xs font-medium text-[#0F1C2E]">Tax code</label>
                    <p className="mt-0.5 text-[10px] text-[#5A7A9B]">Leave blank for default (1257L)</p>
                    <input
                      id="tax-code"
                      type="text"
                      value={taxCode}
                      onChange={(e) => setTaxCode(e.target.value)}
                      placeholder="e.g. 1257L"
                      className="mt-1 w-full rounded-lg border border-[#B8D0EB] bg-[#F0F5FB] py-2 px-2.5 text-xs text-[#0F1C2E] uppercase outline-none transition focus:border-[#2E88D0] focus:ring-1 focus:ring-[#2E88D0]"
                    />
                  </div>

                  {/* Marriage allowance */}
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={marriageAllowance}
                      onChange={(e) => setMarriageAllowance(e.target.checked)}
                      className="h-3.5 w-3.5 rounded border-[#B8D0EB] text-[#2E88D0] focus:ring-[#2E88D0]"
                    />
                    <span className="text-xs text-[#0F1C2E]">Marriage Allowance (+£1,260)</span>
                  </label>

                  {/* Blind person's allowance */}
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={blindPersonsAllowance}
                      onChange={(e) => setBlindPersonsAllowance(e.target.checked)}
                      className="h-3.5 w-3.5 rounded border-[#B8D0EB] text-[#2E88D0] focus:ring-[#2E88D0]"
                    />
                    <span className="text-xs text-[#0F1C2E]">Blind Person&apos;s Allowance (+£3,070)</span>
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* ── Right: results ──────────────────────────────────────── */}
          <div>
            {result ? (
              <div className="sticky top-4 space-y-3">
                {/* Summary card */}
                <div className="rounded-xl border border-[#2E88D0]/30 bg-[#2E88D0]/10 p-4 text-center">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-[#2E4A63]">Estimated take-home pay</p>
                  <p className="mt-0.5 text-3xl font-bold text-[#0F1C2E]">£{fmtShort(result.takeHome)}</p>
                  <p className="mt-0.5 text-xs text-[#2E4A63]">£{fmtShort(Math.round(result.takeHome / 12))}/month · £{fmtShort(Math.round(result.takeHome / 52))}/week</p>
                  <p className="mt-1 text-[10px] text-[#5A7A9B]">Effective rate: {result.effectiveRate.toFixed(1)}%</p>
                </div>

                {/* Breakdown */}
                <div className="rounded-xl border border-[#B8D0EB] bg-white p-4">
                  <p className="text-xs font-semibold text-[#0F1C2E]">Breakdown</p>

                  <div className="mt-2 divide-y divide-[#F0F5FB]">
                    <ResultRow label={employmentType === "employed" ? "Gross salary" : "Gross income"} value={result.grossIncome} bold />
                    {employmentType === "self-employed" && result.expenses > 0 && (
                      <ResultRow label="Expenses" value={-result.expenses} />
                    )}
                    {result.pensionDeduction > 0 && (
                      <ResultRow label="Pension" value={-result.pensionDeduction} />
                    )}
                    <ResultRow label={`Personal Allowance`} value={result.personalAllowance} />
                  </div>

                  <div className="mt-2 border-t border-[#B8D0EB] pt-2">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-[#5A7A9B]">Deductions</p>
                    <div className="mt-1 divide-y divide-[#F0F5FB]">
                      <ResultRow label="Income Tax" value={result.incomeTax} />
                      {employmentType === "employed" ? (
                        <ResultRow label="Employee NI" value={result.employeeNIC} />
                      ) : (
                        <ResultRow label="Class 4 NICs" value={result.class4NIC} />
                      )}
                      {result.studentLoanRepayments.map((sl) => (
                        <ResultRow key={sl.plan} label={`${sl.plan === "postgrad" ? "Postgrad" : sl.plan.replace("plan", "Plan ")}`} value={sl.amount} />
                      ))}
                      {result.pensionDeduction > 0 && (
                        <ResultRow label="Pension" value={result.pensionDeduction} />
                      )}
                      <ResultRow label="Total deductions" value={result.totalDeductions} bold />
                    </div>
                  </div>

                  <div className="mt-2 border-t border-[#B8D0EB] pt-2">
                    <ResultRow label="Take-home" value={result.takeHome} bold accent />
                    <div className="mt-1 grid grid-cols-3 gap-1 text-center">
                      <div><p className="text-[10px] text-[#5A7A9B]">Year</p><p className="text-xs font-medium text-[#0F1C2E]">£{fmtShort(result.takeHome)}</p></div>
                      <div><p className="text-[10px] text-[#5A7A9B]">Month</p><p className="text-xs font-medium text-[#0F1C2E]">£{fmt(result.takeHome / 12)}</p></div>
                      <div><p className="text-[10px] text-[#5A7A9B]">Week</p><p className="text-xs font-medium text-[#0F1C2E]">£{fmt(result.takeHome / 52)}</p></div>
                    </div>
                  </div>
                </div>

                {result.personalAllowance < 0 && (
                  <p className="text-[10px] text-amber-700">K code: £{fmtShort(Math.abs(result.personalAllowance))} added to taxable income.</p>
                )}
                {result.personalAllowance >= 0 && result.personalAllowance < 12_570 && !taxCode && (
                  <p className="text-[10px] text-amber-700">PA reduced to £{fmtShort(result.personalAllowance)} (income over £100k).</p>
                )}
                {employmentType === "self-employed" && profit > 6_845 && (
                  <p className="text-[10px] text-[#5A7A9B]">Class 2 NICs (£182/yr) voluntary since April 2024, not included.</p>
                )}
                <p className="text-[9px] leading-tight text-[#8BA4BD]">
                  Estimate — 2025–26 England/Wales/NI rates. Does not include Scottish rates or other reliefs. Your actual liability may differ.
                </p>
              </div>
            ) : isLoss ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center">
                <p className="text-sm font-medium text-amber-800">Your expenses exceed your income</p>
                <p className="mt-2 text-xs text-amber-700">
                  Your business made a loss of £{fmtShort(Math.abs(profit))} this year. You won&apos;t owe any income tax or NICs on this business.
                  You may be able to carry the loss forward to offset against future profits — speak to an accountant or check HMRC&apos;s guidance on trading losses.
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-[#B8D0EB] bg-white p-6 text-center">
                <p className="text-xs text-[#2E4A63]">Enter your income to see your estimated tax breakdown.</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Rate tables ───────────────────────────────────────────── */}
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-[#B8D0EB] bg-white p-4">
            <h2 className="text-sm font-semibold text-[#0F1C2E]">Income Tax Rates 2025–26</h2>
            <table className="mt-4 w-full text-sm">
              <thead>
                <tr className="border-b border-[#B8D0EB]">
                  <th className="pb-2 text-left text-xs font-medium uppercase tracking-wide text-[#5A7A9B]">Band</th>
                  <th className="pb-2 text-left text-xs font-medium uppercase tracking-wide text-[#5A7A9B]">Range</th>
                  <th className="pb-2 text-right text-xs font-medium uppercase tracking-wide text-[#5A7A9B]">Rate</th>
                </tr>
              </thead>
              <tbody className="text-[#0F1C2E]">
                <tr className="border-b border-[#F0F5FB]"><td className="py-2">Personal Allowance</td><td className="py-2">Up to £12,570</td><td className="py-2 text-right">0%</td></tr>
                <tr className="border-b border-[#F0F5FB]"><td className="py-2">Basic rate</td><td className="py-2">£12,571 – £50,270</td><td className="py-2 text-right">20%</td></tr>
                <tr className="border-b border-[#F0F5FB]"><td className="py-2">Higher rate</td><td className="py-2">£50,271 – £125,140</td><td className="py-2 text-right">40%</td></tr>
                <tr><td className="py-2">Additional rate</td><td className="py-2">Over £125,140</td><td className="py-2 text-right">45%</td></tr>
              </tbody>
            </table>
          </div>

          <div className="rounded-xl border border-[#B8D0EB] bg-white p-4">
            <h2 className="text-sm font-semibold text-[#0F1C2E]">National Insurance 2025–26</h2>
            <h3 className="mt-4 text-sm font-medium text-[#0F1C2E]">{employmentType === "employed" ? "Employee (Class 1)" : "Self-employed (Class 4)"}</h3>
            <table className="mt-2 w-full text-sm">
              <tbody className="text-[#0F1C2E]">
                {employmentType === "employed" ? (
                  <>
                    <tr className="border-b border-[#F0F5FB]"><td className="py-2">£12,570 – £50,270</td><td className="py-2 text-right">8%</td></tr>
                    <tr><td className="py-2">Above £50,270</td><td className="py-2 text-right">2%</td></tr>
                  </>
                ) : (
                  <>
                    <tr className="border-b border-[#F0F5FB]"><td className="py-2">£12,570 – £50,270</td><td className="py-2 text-right">6%</td></tr>
                    <tr><td className="py-2">Above £50,270</td><td className="py-2 text-right">2%</td></tr>
                  </>
                )}
              </tbody>
            </table>

            <h3 className="mt-5 text-sm font-medium text-[#0F1C2E]">Student Loan Thresholds</h3>
            <table className="mt-2 w-full text-sm">
              <tbody className="text-[#0F1C2E]">
                <tr className="border-b border-[#F0F5FB]"><td className="py-1.5">Plan 1</td><td className="py-1.5 text-right">9% over £26,065</td></tr>
                <tr className="border-b border-[#F0F5FB]"><td className="py-1.5">Plan 2</td><td className="py-1.5 text-right">9% over £28,470</td></tr>
                <tr className="border-b border-[#F0F5FB]"><td className="py-1.5">Plan 4</td><td className="py-1.5 text-right">9% over £31,395</td></tr>
                <tr className="border-b border-[#F0F5FB]"><td className="py-1.5">Plan 5</td><td className="py-1.5 text-right">9% over £25,000</td></tr>
                <tr><td className="py-1.5">Postgraduate</td><td className="py-1.5 text-right">6% over £21,000</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ── CTA ───────────────────────────────────────────────────── */}
        <div className="mt-6 rounded-xl border border-[#2E88D0]/30 bg-[#2E88D0]/10 px-6 py-5 text-center">
          <h2 className="text-sm font-semibold text-[#0F1C2E]">Self-employed? Need to submit to HMRC?</h2>
          <p className="mx-auto mt-2 max-w-[500px] text-sm leading-6 text-[#2E4A63]">
            From April 2026, sole traders and landlords earning over £50,000 must submit quarterly updates to HMRC.
            Flonancial is free bridging software — upload your spreadsheet and submit in minutes.
          </p>
          <Link href="/signup" className="mt-5 inline-block rounded-2xl bg-[#2E88D0] px-6 py-3 text-sm font-medium text-white transition hover:opacity-90">
            Create your free account
          </Link>
          <p className="mt-3 text-xs leading-5 text-[#2E4A63]">Free · No card required</p>
        </div>

        {/* ── SEO content ───────────────────────────────────────────── */}
        <div className="mt-6 space-y-3 text-xs leading-6 text-[#2E4A63]">
          <h2 className="text-sm font-semibold text-[#0F1C2E]">How is UK tax calculated?</h2>
          <p>Whether you&apos;re employed or self-employed, you pay income tax on earnings above your Personal Allowance (£12,570 for 2025–26). Employed people also pay Class 1 National Insurance at 8% on earnings between £12,570 and £50,270, and 2% above. Self-employed people pay Class 4 NICs at 6% and 2% on the same bands.</p>
          <p>Student loan repayments are deducted at 9% (or 6% for postgraduate loans) on income above your plan&apos;s threshold. You can have multiple student loans simultaneously — for example, a Plan 2 undergraduate loan and a postgraduate loan. Pension contributions reduce your taxable income, saving you tax at your marginal rate.</p>
          <p>Your tax code determines your Personal Allowance. The standard code for 2025–26 is 1257L, giving you £12,570 tax-free. If you have benefits in kind, underpaid tax from previous years, or other adjustments, HMRC will issue a different code. K codes mean you owe more than your allowance covers, and the excess is added to your taxable income.</p>
          <h2 className="text-sm font-semibold text-[#0F1C2E]">Making Tax Digital</h2>
          <p>From April 2026, self-employed sole traders and landlords with qualifying income over £50,000 must keep digital records and submit quarterly updates to HMRC. Flonancial is free MTD bridging software — upload your spreadsheet and submit in minutes.</p>
        </div>
      </section>
    </SiteShell>
  );
}
