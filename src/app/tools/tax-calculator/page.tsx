"use client";

import { useState } from "react";
import Link from "next/link";
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
    <div className="flex items-center justify-between py-2">
      <span className={`text-sm ${bold ? "font-semibold text-[#0F1C2E]" : "text-[#2E4A63]"}`}>{label}</span>
      <span className={`text-sm font-medium ${accent ? "text-[#2E88D0]" : bold ? "font-semibold text-[#0F1C2E]" : "text-[#0F1C2E]"}`}>
        £{fmt(value)}
      </span>
    </div>
  );
}

export default function TaxCalculatorPage() {
  const [employmentType, setEmploymentType] = useState<EmploymentType>("self-employed");
  const [income, setIncome] = useState("");
  const [expenses, setExpenses] = useState("");
  const [studentLoan, setStudentLoan] = useState<StudentLoanPlan>("none");
  const [pensionPercent, setPensionPercent] = useState("");

  const incomeNum = parseFloat(income) || 0;
  const expensesNum = parseFloat(expenses) || 0;
  const pensionNum = parseFloat(pensionPercent) || 0;

  const profit = employmentType === "self-employed" ? incomeNum - expensesNum : incomeNum;
  const hasResult = profit > 0;

  let result: TaxResult | null = null;
  if (hasResult) {
    result = calculateFullTax({
      income: incomeNum,
      expenses: expensesNum,
      employmentType,
      studentLoan,
      pensionPercent: pensionNum,
    });
  }

  return (
    <main className="min-h-screen bg-[#F0F5FB]">
      <header className="border-b border-[#B8D0EB] bg-white">
        <div className="mx-auto flex max-w-[900px] items-center justify-between px-6 py-4">
          <Link href="/" className="text-lg font-semibold text-[#0F1C2E]">Flonancial</Link>
          <Link href="/signup" className="rounded-xl bg-[#2E88D0] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90">
            Create free account
          </Link>
        </div>
      </header>

      <section className="mx-auto w-full max-w-[900px] px-6 py-10">
        <h1 className="text-3xl font-semibold tracking-tight text-[#0F1C2E]">UK Tax Calculator 2025–26</h1>
        <p className="mt-2 text-base leading-7 text-[#2E4A63]">
          Calculate your income tax, National Insurance, student loan repayments, and take-home pay for the 2025–26 tax year.
        </p>

        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          {/* ── Left: inputs ────────────────────────────────────────── */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-[#B8D0EB] bg-white p-6">
              {/* Employment type toggle */}
              <div>
                <p className="text-sm font-medium text-[#0F1C2E]">I am</p>
                <div className="mt-2 flex gap-2">
                  {([
                    ["self-employed", "Self-employed"],
                    ["employed", "Employed"],
                  ] as const).map(([val, label]) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setEmploymentType(val)}
                      className={`rounded-xl px-4 py-2.5 text-sm font-medium transition ${
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
              <div className="mt-5">
                <label htmlFor="income" className="block text-sm font-medium text-[#0F1C2E]">
                  {employmentType === "employed" ? "Annual salary" : "Annual income (turnover)"}
                </label>
                <p className="mt-0.5 text-xs text-[#5A7A9B]">
                  {employmentType === "employed" ? "Your gross annual salary before deductions" : "Total self-employment income before expenses"}
                </p>
                <div className="relative mt-2">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#5A7A9B]">£</span>
                  <input id="income" type="number" min="0" step="1" value={income} onChange={(e) => setIncome(e.target.value)} placeholder={employmentType === "employed" ? "e.g. 35000" : "e.g. 55000"} className="w-full rounded-xl border border-[#B8D0EB] bg-[#F0F5FB] py-3 pl-7 pr-3 text-sm text-[#0F1C2E] outline-none transition focus:border-[#2E88D0] focus:ring-1 focus:ring-[#2E88D0]" />
                </div>
              </div>

              {/* Expenses (self-employed only) */}
              {employmentType === "self-employed" && (
                <div className="mt-5">
                  <label htmlFor="expenses" className="block text-sm font-medium text-[#0F1C2E]">Annual expenses</label>
                  <p className="mt-0.5 text-xs text-[#5A7A9B]">Allowable business expenses for the year</p>
                  <div className="relative mt-2">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#5A7A9B]">£</span>
                    <input id="expenses" type="number" min="0" step="1" value={expenses} onChange={(e) => setExpenses(e.target.value)} placeholder="e.g. 8000" className="w-full rounded-xl border border-[#B8D0EB] bg-[#F0F5FB] py-3 pl-7 pr-3 text-sm text-[#0F1C2E] outline-none transition focus:border-[#2E88D0] focus:ring-1 focus:ring-[#2E88D0]" />
                  </div>
                </div>
              )}

              {/* Pension */}
              <div className="mt-5">
                <label htmlFor="pension" className="block text-sm font-medium text-[#0F1C2E]">Pension contribution (%)</label>
                <p className="mt-0.5 text-xs text-[#5A7A9B]">
                  {employmentType === "employed" ? "Employee contribution — reduces your taxable income" : "Personal pension contribution — gets tax relief"}
                </p>
                <div className="relative mt-2">
                  <input id="pension" type="number" min="0" max="100" step="1" value={pensionPercent} onChange={(e) => setPensionPercent(e.target.value)} placeholder="e.g. 5" className="w-full rounded-xl border border-[#B8D0EB] bg-[#F0F5FB] py-3 px-3 pr-8 text-sm text-[#0F1C2E] outline-none transition focus:border-[#2E88D0] focus:ring-1 focus:ring-[#2E88D0]" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[#5A7A9B]">%</span>
                </div>
              </div>

              {/* Student loan */}
              <div className="mt-5">
                <label htmlFor="student-loan" className="block text-sm font-medium text-[#0F1C2E]">Student loan</label>
                <p className="mt-0.5 text-xs text-[#5A7A9B]">Select your repayment plan type</p>
                <select
                  id="student-loan"
                  value={studentLoan}
                  onChange={(e) => setStudentLoan(e.target.value as StudentLoanPlan)}
                  className="mt-2 w-full rounded-xl border border-[#B8D0EB] bg-[#F0F5FB] py-3 px-3 text-sm text-[#0F1C2E] outline-none transition focus:border-[#2E88D0] focus:ring-1 focus:ring-[#2E88D0]"
                >
                  <option value="none">No student loan</option>
                  <option value="plan1">Plan 1 (started before Sept 2012)</option>
                  <option value="plan2">Plan 2 (started Sept 2012 onwards)</option>
                  <option value="plan4">Plan 4 (Scottish)</option>
                  <option value="plan5">Plan 5 (started Sept 2023 onwards)</option>
                  <option value="postgrad">Postgraduate loan</option>
                </select>
              </div>
            </div>
          </div>

          {/* ── Right: results ──────────────────────────────────────── */}
          <div>
            {result ? (
              <div className="space-y-4">
                {/* Summary card */}
                <div className="rounded-2xl border border-[#2E88D0]/30 bg-[#2E88D0]/10 p-6 text-center">
                  <p className="text-xs font-medium uppercase tracking-wide text-[#2E4A63]">Estimated take-home pay</p>
                  <p className="mt-1 text-4xl font-bold text-[#0F1C2E]">£{fmtShort(result.takeHome)}</p>
                  <p className="mt-1 text-sm text-[#2E4A63]">£{fmtShort(Math.round(result.takeHome / 12))}/month</p>
                  <p className="mt-2 text-xs text-[#5A7A9B]">Effective tax rate: {result.effectiveRate.toFixed(1)}%</p>
                </div>

                {/* Breakdown */}
                <div className="rounded-2xl border border-[#B8D0EB] bg-white p-6">
                  <p className="text-sm font-semibold text-[#0F1C2E]">Breakdown</p>

                  <div className="mt-3 divide-y divide-[#F0F5FB]">
                    <ResultRow label={employmentType === "employed" ? "Gross salary" : "Gross income"} value={result.grossIncome} bold />
                    {employmentType === "self-employed" && result.expenses > 0 && (
                      <ResultRow label="Expenses" value={-result.expenses} />
                    )}
                    {result.pensionDeduction > 0 && (
                      <ResultRow label="Pension contribution" value={-result.pensionDeduction} />
                    )}
                    <ResultRow label={`Taxable income (PA: £${fmtShort(result.personalAllowance)})`} value={result.taxableIncome} />
                  </div>

                  <div className="mt-4 border-t border-[#B8D0EB] pt-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-[#5A7A9B]">Deductions</p>
                    <div className="mt-2 divide-y divide-[#F0F5FB]">
                      <ResultRow label="Income Tax" value={result.incomeTax} />
                      {employmentType === "employed" ? (
                        <ResultRow label="Employee NI (Class 1)" value={result.employeeNIC} />
                      ) : (
                        <ResultRow label="Class 4 NICs" value={result.class4NIC} />
                      )}
                      {result.studentLoanRepayment > 0 && (
                        <ResultRow label="Student loan repayment" value={result.studentLoanRepayment} />
                      )}
                      {result.pensionDeduction > 0 && (
                        <ResultRow label="Pension" value={result.pensionDeduction} />
                      )}
                      <ResultRow label="Total deductions" value={result.totalDeductions} bold />
                    </div>
                  </div>

                  <div className="mt-4 border-t border-[#B8D0EB] pt-3">
                    <ResultRow label="Take-home pay" value={result.takeHome} bold accent />
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-xs text-[#5A7A9B]">Monthly</span>
                      <span className="text-xs font-medium text-[#5A7A9B]">£{fmt(result.takeHome / 12)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#5A7A9B]">Weekly</span>
                      <span className="text-xs font-medium text-[#5A7A9B]">£{fmt(result.takeHome / 52)}</span>
                    </div>
                  </div>
                </div>

                {result.personalAllowance < 12_570 && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <p className="text-xs text-amber-800">Your Personal Allowance is reduced to £{fmtShort(result.personalAllowance)} because your income exceeds £100,000.</p>
                  </div>
                )}

                {employmentType === "self-employed" && profit > 6_845 && (
                  <p className="text-xs text-[#5A7A9B]">Class 2 NICs (£182/year) are voluntary since April 2024 and not included above.</p>
                )}

                <p className="text-[10px] leading-tight text-[#8BA4BD]">
                  Estimate only — 2025–26 England, Wales &amp; NI rates. Does not include Scottish rates, marriage allowance, blind person&apos;s allowance, or other reliefs. Your actual liability may differ.
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border border-[#B8D0EB] bg-white p-8 text-center">
                <p className="text-sm text-[#2E4A63]">Enter your income to see your estimated tax breakdown.</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Rate tables ───────────────────────────────────────────── */}
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-[#B8D0EB] bg-white p-6">
            <h2 className="text-lg font-semibold text-[#0F1C2E]">Income Tax Rates 2025–26</h2>
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

          <div className="rounded-2xl border border-[#B8D0EB] bg-white p-6">
            <h2 className="text-lg font-semibold text-[#0F1C2E]">National Insurance 2025–26</h2>
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
                <tr className="border-b border-[#F0F5FB]"><td className="py-1.5">Plan 4</td><td className="py-1.5 text-right">9% over £32,745</td></tr>
                <tr className="border-b border-[#F0F5FB]"><td className="py-1.5">Plan 5</td><td className="py-1.5 text-right">9% over £25,000</td></tr>
                <tr><td className="py-1.5">Postgraduate</td><td className="py-1.5 text-right">6% over £21,000</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ── CTA ───────────────────────────────────────────────────── */}
        <div className="mt-10 rounded-2xl border border-[#2E88D0]/30 bg-[#2E88D0]/10 px-8 py-8 text-center">
          <h2 className="text-lg font-semibold text-[#0F1C2E]">Need to submit to HMRC?</h2>
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
        <div className="mt-10 space-y-4 text-sm leading-7 text-[#2E4A63]">
          <h2 className="text-lg font-semibold text-[#0F1C2E]">How is UK tax calculated?</h2>
          <p>Whether you&apos;re employed or self-employed, you pay income tax on earnings above your Personal Allowance (£12,570 for 2025–26). Employed people also pay Class 1 National Insurance at 8% on earnings between £12,570 and £50,270, and 2% above. Self-employed people pay Class 4 NICs at 6% and 2% on the same bands.</p>
          <p>Student loan repayments are deducted at 9% (or 6% for postgraduate loans) on income above your plan&apos;s threshold. Pension contributions reduce your taxable income, saving you tax at your marginal rate.</p>
          <h2 className="text-lg font-semibold text-[#0F1C2E]">Making Tax Digital</h2>
          <p>From April 2026, self-employed sole traders and landlords with qualifying income over £50,000 must keep digital records and submit quarterly updates to HMRC. Flonancial is free MTD bridging software — upload your spreadsheet and submit in minutes.</p>
        </div>
      </section>
    </main>
  );
}
