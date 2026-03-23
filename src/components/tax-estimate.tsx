"use client";

/**
 * Tax estimate component — shows estimated annual income tax + NICs
 * 2025-26 England/Wales/NI rates. Does NOT cover Scottish rates.
 * ESTIMATE only — clearly labelled as such per HMRC guidance.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type EmploymentType = "self-employed" | "employed";
export type StudentLoanPlan = "none" | "plan1" | "plan2" | "plan4" | "plan5" | "postgrad";

export interface TaxInputs {
  income: number;
  expenses: number;
  employmentType: EmploymentType;
  studentLoan: StudentLoanPlan;
  pensionPercent: number; // 0-100
}

export interface TaxResult {
  grossIncome: number;
  expenses: number;
  pensionDeduction: number;
  taxableIncome: number;
  personalAllowance: number;
  incomeTax: number;
  employeeNIC: number;
  class4NIC: number;
  class2NIC: number;
  studentLoanRepayment: number;
  totalDeductions: number;
  takeHome: number;
  effectiveRate: number;
}

// ─── Calculation engine ───────────────────────────────────────────────────────

export function calculateFullTax(inputs: TaxInputs): TaxResult {
  const { income, expenses, employmentType, studentLoan, pensionPercent } = inputs;
  const grossIncome = income;
  const profit = employmentType === "self-employed" ? income - expenses : income;

  // Pension deduction (salary sacrifice / relief at source — reduces taxable income)
  // For employed: pension on qualifying earnings (£6,240–£50,270)
  // Simplified: apply percentage to gross
  const pensionDeduction = profit > 0 ? Math.round(profit * (pensionPercent / 100) * 100) / 100 : 0;
  const incomeAfterPension = Math.max(0, profit - pensionDeduction);

  // Personal Allowance (tapers £1 for every £2 over £100,000)
  const basePA = 12_570;
  let personalAllowance = basePA;
  if (incomeAfterPension > 100_000) {
    personalAllowance = Math.max(0, basePA - Math.floor((incomeAfterPension - 100_000) / 2));
  }

  // Income Tax bands 2025-26
  const taxable = Math.max(0, incomeAfterPension - personalAllowance);
  const basicLimit = 37_700;
  const higherLimit = 87_440;

  let incomeTax = 0;
  if (taxable <= basicLimit) {
    incomeTax = taxable * 0.2;
  } else if (taxable <= basicLimit + higherLimit) {
    incomeTax = basicLimit * 0.2 + (taxable - basicLimit) * 0.4;
  } else {
    incomeTax = basicLimit * 0.2 + higherLimit * 0.4 + (taxable - basicLimit - higherLimit) * 0.45;
  }

  // National Insurance
  let employeeNIC = 0;
  let class4NIC = 0;
  const class2NIC = 0; // voluntary since April 2024

  if (employmentType === "employed") {
    // Class 1 Employee NIC: 8% on £12,570–£50,270, 2% above
    const nicLower = 12_570;
    const nicUpper = 50_270;
    if (income > nicLower) {
      employeeNIC = Math.min(income, nicUpper) - nicLower;
      employeeNIC *= 0.08;
      if (income > nicUpper) {
        employeeNIC += (income - nicUpper) * 0.02;
      }
    }
  } else {
    // Class 4 NIC: 6% on £12,570–£50,270, 2% above
    if (profit > 12_570) {
      class4NIC = (Math.min(profit, 50_270) - 12_570) * 0.06;
      if (profit > 50_270) {
        class4NIC += (profit - 50_270) * 0.02;
      }
    }
  }

  // Student loan repayments
  const slThresholds: Record<StudentLoanPlan, { threshold: number; rate: number }> = {
    none: { threshold: 0, rate: 0 },
    plan1: { threshold: 26_065, rate: 0.09 },
    plan2: { threshold: 28_470, rate: 0.09 },
    plan4: { threshold: 32_745, rate: 0.09 },
    plan5: { threshold: 25_000, rate: 0.09 },
    postgrad: { threshold: 21_000, rate: 0.06 },
  };
  const sl = slThresholds[studentLoan];
  const studentLoanRepayment = studentLoan !== "none" && incomeAfterPension > sl.threshold
    ? (incomeAfterPension - sl.threshold) * sl.rate
    : 0;

  const nic = employeeNIC + class4NIC;
  const totalDeductions = incomeTax + nic + studentLoanRepayment + pensionDeduction;
  const takeHome = profit - incomeTax - nic - studentLoanRepayment - pensionDeduction;
  const effectiveRate = profit > 0 ? ((incomeTax + nic + studentLoanRepayment) / profit) * 100 : 0;

  return {
    grossIncome,
    expenses,
    pensionDeduction,
    taxableIncome: incomeAfterPension,
    personalAllowance,
    incomeTax,
    employeeNIC,
    class4NIC,
    class2NIC,
    studentLoanRepayment,
    totalDeductions,
    takeHome,
    effectiveRate,
  };
}

// ─── Formatting ───────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ─── Simple component (used on business page, preview, demo, submit) ─────────

interface TaxEstimateProps {
  turnover: number;
  expenses: number;
  isQuarterly?: boolean;
  compact?: boolean;
}

export default function TaxEstimate({ turnover, expenses, isQuarterly, compact }: TaxEstimateProps) {
  const rawProfit = turnover - expenses;
  const annualProfit = isQuarterly ? rawProfit * 4 : rawProfit;

  if (annualProfit <= 0) return null;

  const t = calculateFullTax({
    income: isQuarterly ? turnover * 4 : turnover,
    expenses: isQuarterly ? expenses * 4 : expenses,
    employmentType: "self-employed",
    studentLoan: "none",
    pensionPercent: 0,
  });

  if (compact) {
    return (
      <div className="rounded-xl border border-[#B8D0EB] bg-[#F0F5FB] p-4">
        <p className="text-xs font-medium text-[#2E4A63]">Estimated annual tax on £{fmt(annualProfit)} profit</p>
        <p className="mt-1 text-2xl font-bold text-[#0F1C2E]">£{fmt(t.incomeTax + t.class4NIC)}</p>
        <p className="mt-0.5 text-xs text-[#5A7A9B]">
          Income Tax £{fmt(t.incomeTax)} · Class 4 NICs £{fmt(t.class4NIC)} · {t.effectiveRate.toFixed(1)}% effective rate
        </p>
        <p className="mt-2 text-[10px] leading-tight text-[#8BA4BD]">
          Estimate only based on 2025–26 England/Wales rates. Your actual liability may differ.
          {isQuarterly && " Annualised from one quarter's figures."}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#B8D0EB] bg-[#F0F5FB] p-5">
      <p className="text-sm font-semibold text-[#0F1C2E]">Estimated annual tax</p>
      <p className="mt-0.5 text-xs text-[#5A7A9B]">
        Based on {isQuarterly ? "this quarter annualised" : "your figures"} — £{fmt(annualProfit)} profit
      </p>

      <div className="mt-3 grid grid-cols-3 gap-3">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-[#5A7A9B]">Income Tax</p>
          <p className="mt-0.5 text-lg font-bold text-[#0F1C2E]">£{fmt(t.incomeTax)}</p>
        </div>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-[#5A7A9B]">Class 4 NICs</p>
          <p className="mt-0.5 text-lg font-bold text-[#0F1C2E]">£{fmt(t.class4NIC)}</p>
        </div>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-[#5A7A9B]">Total</p>
          <p className="mt-0.5 text-lg font-bold text-[#2E88D0]">£{fmt(t.incomeTax + t.class4NIC)}</p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between rounded-lg bg-white/60 px-3 py-2">
        <span className="text-xs text-[#2E4A63]">Effective tax rate</span>
        <span className="text-sm font-semibold text-[#0F1C2E]">{t.effectiveRate.toFixed(1)}%</span>
      </div>

      {t.class2NIC === 0 && annualProfit > 6_845 && (
        <p className="mt-2 text-[11px] text-[#5A7A9B]">
          Class 2 NICs (£182.00/year) are voluntary since April 2024 and not included above.
        </p>
      )}

      {t.personalAllowance < 12_570 && (
        <p className="mt-2 text-[11px] text-amber-700">
          Your Personal Allowance is reduced to £{fmt(t.personalAllowance)} because your income exceeds £100,000.
        </p>
      )}

      <p className="mt-3 text-[10px] leading-tight text-[#8BA4BD]">
        Estimate only — 2025–26 England, Wales &amp; NI rates. Does not include Scottish rates, student loans, marriage allowance, or other reliefs. Your actual liability may differ.
        {isQuarterly && " Figures annualised from a single quarter."}
      </p>
    </div>
  );
}
