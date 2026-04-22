"use client";

/**
 * Tax estimate component — shows estimated annual income tax + NICs
 * 2025-26 England/Wales/NI rates. Does NOT cover Scottish rates.
 * ESTIMATE only — clearly labelled as such per HMRC guidance.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type EmploymentType = "self-employed" | "employed";
export type StudentLoanPlan = "plan1" | "plan2" | "plan4" | "plan5" | "postgrad";

export interface TaxInputs {
  income: number;
  expenses: number;
  employmentType: EmploymentType;
  studentLoans: StudentLoanPlan[]; // multiple loans
  pensionPercent: number;
  taxCode: string; // e.g. "1257L", "BR", "0T", "K475", custom PA
  marriageAllowance: boolean; // receiving marriage allowance transfer
  blindPersonsAllowance: boolean;
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
  studentLoanRepayments: { plan: StudentLoanPlan; amount: number }[];
  totalStudentLoan: number;
  totalDeductions: number;
  takeHome: number;
  effectiveRate: number;
}

// ─── Tax code parser ──────────────────────────────────────────────────────────

export function parseTaxCode(code: string): number | null {
  const cleaned = code.trim().toUpperCase();
  if (!cleaned) return null; // no code entered, use default

  // Special codes
  if (cleaned === "BR") return 0; // all basic rate
  if (cleaned === "D0") return 0; // all higher rate (handled separately)
  if (cleaned === "D1") return 0; // all additional rate
  if (cleaned === "0T" || cleaned === "OT") return 0;
  if (cleaned === "NT") return -1; // no tax (special marker)

  // K codes — negative allowance (adds to taxable income)
  const kMatch = cleaned.match(/^K(\d+)$/);
  if (kMatch) return -(parseInt(kMatch[1]) * 10);

  // Standard codes like 1257L, 1100L, S1257L, C1257L
  const stdMatch = cleaned.match(/^[SC]?(\d+)[LTMNY]$/);
  if (stdMatch) return parseInt(stdMatch[1]) * 10;

  return null; // unrecognised
}

// ─── Calculation engine ───────────────────────────────────────────────────────

export function calculateFullTax(inputs: TaxInputs): TaxResult {
  const { income, expenses, employmentType, studentLoans, pensionPercent, taxCode, marriageAllowance, blindPersonsAllowance } = inputs;
  const grossIncome = income;
  const profit = employmentType === "self-employed" ? income - expenses : income;

  // Pension deduction
  const pensionDeduction = profit > 0 ? Math.round(profit * (pensionPercent / 100) * 100) / 100 : 0;
  const incomeAfterPension = Math.max(0, profit - pensionDeduction);

  // Personal Allowance from tax code or default
  const basePA = 12_570;
  const parsedPA = parseTaxCode(taxCode);
  let personalAllowance: number;

  if (parsedPA === null) {
    // No tax code or unrecognised — use default with taper
    personalAllowance = basePA;
    if (incomeAfterPension > 100_000) {
      personalAllowance = Math.max(0, basePA - Math.floor((incomeAfterPension - 100_000) / 2));
    }
  } else if (parsedPA === -1) {
    // NT code — no tax
    personalAllowance = incomeAfterPension;
  } else if (parsedPA < 0) {
    // K code — negative allowance
    personalAllowance = parsedPA;
  } else {
    personalAllowance = parsedPA;
  }

  // Marriage allowance — receiving partner gets extra £1,260
  if (marriageAllowance && personalAllowance >= 0) {
    personalAllowance += 1_260;
  }

  // Blind person's allowance — extra £3,070 for 2025-26
  if (blindPersonsAllowance && personalAllowance >= 0) {
    personalAllowance += 3_070;
  }

  // Income Tax bands 2025-26
  const cleaned = taxCode.trim().toUpperCase();
  const isScottish = cleaned.startsWith("S");
  let incomeTax = 0;

  if (cleaned === "NT" || cleaned === "SNT") {
    incomeTax = 0;
  } else if (cleaned === "BR" || cleaned === "SBR") {
    incomeTax = incomeAfterPension * 0.2;
  } else if (cleaned === "D0" || cleaned === "SD0") {
    incomeTax = incomeAfterPension * (isScottish ? 0.21 : 0.4);
  } else if (cleaned === "D1" || cleaned === "SD1") {
    incomeTax = incomeAfterPension * (isScottish ? 0.42 : 0.45);
  } else if (cleaned === "SD2") {
    incomeTax = incomeAfterPension * 0.48;
  } else {
    const taxable = Math.max(0, incomeAfterPension - personalAllowance);

    if (isScottish) {
      // Scottish 6-band system 2025-26
      const bands = [
        { limit: 2_306, rate: 0.19 },   // Starter: £12,571–£14,876
        { limit: 11_685, rate: 0.20 },   // Basic: £14,877–£26,561
        { limit: 17_101, rate: 0.21 },   // Intermediate: £26,562–£43,662
        { limit: 31_338, rate: 0.42 },   // Higher: £43,663–£75,000
        { limit: 50_140, rate: 0.45 },   // Advanced: £75,001–£125,140
        { limit: Infinity, rate: 0.48 }, // Top: over £125,140
      ];
      let remaining = taxable;
      for (const band of bands) {
        if (remaining <= 0) break;
        const inBand = Math.min(remaining, band.limit);
        incomeTax += inBand * band.rate;
        remaining -= inBand;
      }
    } else {
      // rUK 3-band system 2025-26
      const basicLimit = 37_700;
      const higherLimit = 87_440;

      if (taxable <= basicLimit) {
        incomeTax = taxable * 0.2;
      } else if (taxable <= basicLimit + higherLimit) {
        incomeTax = basicLimit * 0.2 + (taxable - basicLimit) * 0.4;
      } else {
        incomeTax = basicLimit * 0.2 + higherLimit * 0.4 + (taxable - basicLimit - higherLimit) * 0.45;
      }
    }
  }

  // National Insurance
  let employeeNIC = 0;
  let class4NIC = 0;
  const class2NIC = 0;

  if (employmentType === "employed") {
    const nicLower = 12_570;
    const nicUpper = 50_270;
    if (income > nicLower) {
      employeeNIC = (Math.min(income, nicUpper) - nicLower) * 0.08;
      if (income > nicUpper) {
        employeeNIC += (income - nicUpper) * 0.02;
      }
    }
  } else {
    if (profit > 12_570) {
      class4NIC = (Math.min(profit, 50_270) - 12_570) * 0.06;
      if (profit > 50_270) {
        class4NIC += (profit - 50_270) * 0.02;
      }
    }
  }

  // Student loan repayments — multiple simultaneous
  const slThresholds: Record<StudentLoanPlan, { threshold: number; rate: number }> = {
    plan1: { threshold: 26_900, rate: 0.09 },
    plan2: { threshold: 29_385, rate: 0.09 },
    plan4: { threshold: 33_795, rate: 0.09 },
    plan5: { threshold: 25_000, rate: 0.09 },
    postgrad: { threshold: 21_000, rate: 0.06 },
  };

  const studentLoanRepayments = studentLoans.map((plan) => {
    const sl = slThresholds[plan];
    const amount = incomeAfterPension > sl.threshold ? (incomeAfterPension - sl.threshold) * sl.rate : 0;
    return { plan, amount };
  });
  const totalStudentLoan = studentLoanRepayments.reduce((sum, r) => sum + r.amount, 0);

  const nic = employeeNIC + class4NIC;
  const totalDeductions = incomeTax + nic + totalStudentLoan + pensionDeduction;
  const takeHome = profit - incomeTax - nic - totalStudentLoan - pensionDeduction;
  const effectiveRate = profit > 0 ? ((incomeTax + nic + totalStudentLoan) / profit) * 100 : 0;

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
    studentLoanRepayments,
    totalStudentLoan,
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
    studentLoans: [],
    pensionPercent: 0,
    taxCode: "",
    marriageAllowance: false,
    blindPersonsAllowance: false,
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

      {annualProfit > 7_105 && (
        <p className="mt-2 text-[11px] text-[#5A7A9B]">
          Class 2 NICs are auto-credited above the Small Profits Threshold (£7,105) since April 2024 — no payment needed.
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
