"use client";

import { useState } from "react";
import Link from "next/link";
import TaxEstimate from "@/components/tax-estimate";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export default function TaxCalculatorPage() {
  const [income, setIncome] = useState("");
  const [expenses, setExpenses] = useState("");

  const incomeNum = parseFloat(income) || 0;
  const expensesNum = parseFloat(expenses) || 0;
  const profit = incomeNum - expensesNum;

  return (
    <main className="min-h-screen bg-[#F0F5FB]">
      {/* Header */}
      <header className="border-b border-[#B8D0EB] bg-white">
        <div className="mx-auto flex max-w-[800px] items-center justify-between px-6 py-4">
          <Link href="/" className="text-lg font-semibold text-[#0F1C2E]">
            Flonancial
          </Link>
          <Link
            href="/signup"
            className="rounded-xl bg-[#2E88D0] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
          >
            Create free account
          </Link>
        </div>
      </header>

      <section className="mx-auto w-full max-w-[800px] px-6 py-10">
        <h1 className="text-3xl font-semibold tracking-tight text-[#0F1C2E]">
          Self-Employed Tax Calculator
        </h1>
        <p className="mt-2 text-base leading-7 text-[#2E4A63]">
          Estimate your income tax and National Insurance for the 2025–26 tax year.
          Enter your self-employment income and expenses below.
        </p>

        {/* Input form */}
        <div className="mt-8 rounded-2xl border border-[#B8D0EB] bg-white p-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="income" className="block text-sm font-medium text-[#0F1C2E]">
                Annual income (turnover)
              </label>
              <p className="mt-0.5 text-xs text-[#5A7A9B]">Your total self-employment income before expenses</p>
              <div className="relative mt-2">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#5A7A9B]">£</span>
                <input
                  id="income"
                  type="number"
                  min="0"
                  step="1"
                  value={income}
                  onChange={(e) => setIncome(e.target.value)}
                  placeholder="e.g. 55000"
                  className="w-full rounded-xl border border-[#B8D0EB] bg-[#F0F5FB] py-3 pl-7 pr-3 text-sm text-[#0F1C2E] outline-none transition focus:border-[#2E88D0] focus:ring-1 focus:ring-[#2E88D0]"
                />
              </div>
            </div>
            <div>
              <label htmlFor="expenses" className="block text-sm font-medium text-[#0F1C2E]">
                Annual expenses
              </label>
              <p className="mt-0.5 text-xs text-[#5A7A9B]">Your allowable business expenses for the year</p>
              <div className="relative mt-2">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#5A7A9B]">£</span>
                <input
                  id="expenses"
                  type="number"
                  min="0"
                  step="1"
                  value={expenses}
                  onChange={(e) => setExpenses(e.target.value)}
                  placeholder="e.g. 8000"
                  className="w-full rounded-xl border border-[#B8D0EB] bg-[#F0F5FB] py-3 pl-7 pr-3 text-sm text-[#0F1C2E] outline-none transition focus:border-[#2E88D0] focus:ring-1 focus:ring-[#2E88D0]"
                />
              </div>
            </div>
          </div>

          {profit > 0 && (
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-[#F0F5FB] px-4 py-3">
              <p className="text-sm text-[#2E4A63]">
                Taxable profit: <span className="font-semibold text-[#0F1C2E]">{formatCurrency(profit)}</span>
              </p>
            </div>
          )}
        </div>

        {/* Results */}
        {profit > 0 && (
          <div className="mt-6">
            <TaxEstimate turnover={incomeNum} expenses={expensesNum} />
          </div>
        )}

        {/* Tax bands breakdown */}
        <div className="mt-8 rounded-2xl border border-[#B8D0EB] bg-white p-6">
          <h2 className="text-lg font-semibold text-[#0F1C2E]">2025–26 Tax Rates</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#B8D0EB]">
                  <th className="pb-2 pr-4 text-left text-xs font-medium uppercase tracking-wide text-[#5A7A9B]">Band</th>
                  <th className="pb-2 pr-4 text-left text-xs font-medium uppercase tracking-wide text-[#5A7A9B]">Income range</th>
                  <th className="pb-2 text-left text-xs font-medium uppercase tracking-wide text-[#5A7A9B]">Rate</th>
                </tr>
              </thead>
              <tbody className="text-[#0F1C2E]">
                <tr className="border-b border-[#F0F5FB]">
                  <td className="py-2.5 pr-4">Personal Allowance</td>
                  <td className="py-2.5 pr-4">Up to £12,570</td>
                  <td className="py-2.5">0%</td>
                </tr>
                <tr className="border-b border-[#F0F5FB]">
                  <td className="py-2.5 pr-4">Basic rate</td>
                  <td className="py-2.5 pr-4">£12,571 – £50,270</td>
                  <td className="py-2.5">20%</td>
                </tr>
                <tr className="border-b border-[#F0F5FB]">
                  <td className="py-2.5 pr-4">Higher rate</td>
                  <td className="py-2.5 pr-4">£50,271 – £125,140</td>
                  <td className="py-2.5">40%</td>
                </tr>
                <tr>
                  <td className="py-2.5 pr-4">Additional rate</td>
                  <td className="py-2.5 pr-4">Over £125,140</td>
                  <td className="py-2.5">45%</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 className="mt-6 text-sm font-semibold text-[#0F1C2E]">Class 4 National Insurance</h3>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full text-sm">
              <tbody className="text-[#0F1C2E]">
                <tr className="border-b border-[#F0F5FB]">
                  <td className="py-2.5 pr-4">£12,570 – £50,270</td>
                  <td className="py-2.5">6%</td>
                </tr>
                <tr>
                  <td className="py-2.5 pr-4">Above £50,270</td>
                  <td className="py-2.5">2%</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="mt-4 text-xs leading-5 text-[#5A7A9B]">
            Class 2 NICs (£3.50/week) have been voluntary since April 2024. Self-employed people with profits above £6,845 are treated as having paid for state pension purposes without needing to pay.
          </p>

          <p className="mt-2 text-xs leading-5 text-[#5A7A9B]">
            Personal Allowance is reduced by £1 for every £2 of income above £100,000 and is fully withdrawn at £125,140.
          </p>
        </div>

        {/* CTA */}
        <div className="mt-8 rounded-2xl border border-[#2E88D0]/30 bg-[#2E88D0]/10 px-8 py-8 text-center">
          <h2 className="text-lg font-semibold text-[#0F1C2E]">Need to submit to HMRC?</h2>
          <p className="mx-auto mt-2 max-w-[500px] text-sm leading-6 text-[#2E4A63]">
            From April 2026, sole traders and landlords earning over £50,000 must submit quarterly updates to HMRC.
            Flonancial is free bridging software — upload your spreadsheet and submit in minutes.
          </p>
          <Link
            href="/signup"
            className="mt-5 inline-block rounded-2xl bg-[#2E88D0] px-6 py-3 text-sm font-medium text-white transition hover:opacity-90"
          >
            Create your free account
          </Link>
          <p className="mt-3 text-xs leading-5 text-[#2E4A63]">Free · No card required</p>
        </div>

        {/* SEO content */}
        <div className="mt-8 space-y-4 text-sm leading-7 text-[#2E4A63]">
          <h2 className="text-lg font-semibold text-[#0F1C2E]">How is self-employed tax calculated?</h2>
          <p>
            If you&apos;re self-employed in the UK, you pay income tax and National Insurance on your profits — that&apos;s your total income minus allowable business expenses. You don&apos;t pay tax on your turnover, only on what&apos;s left after expenses.
          </p>
          <p>
            Everyone gets a tax-free Personal Allowance of £12,570 (2025–26). After that, you pay 20% on the basic rate band, 40% on the higher rate band, and 45% on the additional rate band. If your income exceeds £100,000, your Personal Allowance is gradually reduced.
          </p>
          <p>
            On top of income tax, self-employed people pay Class 4 National Insurance: 6% on profits between £12,570 and £50,270, and 2% on profits above that. Class 2 NICs (£3.50/week) became voluntary in April 2024 — most self-employed people no longer need to pay them.
          </p>
          <h2 className="text-lg font-semibold text-[#0F1C2E]">Making Tax Digital and quarterly updates</h2>
          <p>
            From April 2026, self-employed sole traders and landlords with qualifying income over £50,000 must keep digital records and submit quarterly updates to HMRC under Making Tax Digital for Income Tax. The threshold drops to £30,000 in April 2027 and £20,000 in April 2028.
          </p>
          <p>
            Flonancial is free MTD bridging software. You keep your existing spreadsheet, upload it each quarter, and submit your figures to HMRC. No accounting software needed, no monthly fees.
          </p>
        </div>
      </section>
    </main>
  );
}
