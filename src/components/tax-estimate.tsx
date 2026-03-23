"use client";

/**
 * Tax estimate component — shows estimated annual income tax + NICs
 * based on self-employment profit.
 *
 * 2025-26 England/Wales/NI rates. Does NOT cover Scottish rates.
 * This is an ESTIMATE only — clearly labelled as such per HMRC guidance.
 */

interface TaxEstimateProps {
  turnover: number;
  expenses: number;
  /** If true, annualises quarterly figures (×4) */
  isQuarterly?: boolean;
  /** Compact layout for inline use */
  compact?: boolean;
}

function calculateTax(annualProfit: number) {
  // Personal Allowance (tapers £1 for every £2 over £100,000)
  const basePA = 12_570;
  let personalAllowance = basePA;
  if (annualProfit > 100_000) {
    personalAllowance = Math.max(0, basePA - Math.floor((annualProfit - 100_000) / 2));
  }

  // Income Tax bands 2025-26
  const taxable = Math.max(0, annualProfit - personalAllowance);
  const basicLimit = 37_700; // £12,571 to £50,270
  const higherLimit = 87_440; // £50,271 to £125,140 (125,140 - 37,700 = 87,440 above basic)

  let incomeTax = 0;
  if (taxable <= basicLimit) {
    incomeTax = taxable * 0.2;
  } else if (taxable <= basicLimit + higherLimit) {
    incomeTax = basicLimit * 0.2 + (taxable - basicLimit) * 0.4;
  } else {
    incomeTax =
      basicLimit * 0.2 +
      higherLimit * 0.4 +
      (taxable - basicLimit - higherLimit) * 0.45;
  }

  // Class 4 NICs 2025-26: 6% on £12,570–£50,270, 2% above £50,270
  const nic4Lower = 12_570;
  const nic4Upper = 50_270;
  let class4 = 0;
  if (annualProfit > nic4Lower) {
    const band1 = Math.min(annualProfit, nic4Upper) - nic4Lower;
    class4 = band1 * 0.06;
    if (annualProfit > nic4Upper) {
      class4 += (annualProfit - nic4Upper) * 0.02;
    }
  }

  // Class 2 NICs 2025-26: £3.50/week — voluntary since April 2024
  // Self-employed with profits > £6,845 are treated as having paid for state pension,
  // but do NOT actually owe it. We exclude it from the total but show it as optional.
  const class2Weekly = 3.50;
  const class2 = annualProfit > 6_845 ? class2Weekly * 52 : 0;

  const totalTax = incomeTax + class4; // Class 2 excluded — it's voluntary

  return {
    annualProfit,
    personalAllowance,
    incomeTax,
    class4,
    class2,
    totalTax,
    effectiveRate: annualProfit > 0 ? (totalTax / annualProfit) * 100 : 0,
  };
}

function fmt(n: number) {
  return n.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function TaxEstimate({ turnover, expenses, isQuarterly, compact }: TaxEstimateProps) {
  const rawProfit = turnover - expenses;
  const annualProfit = isQuarterly ? rawProfit * 4 : rawProfit;

  if (annualProfit <= 0) return null;

  const t = calculateTax(annualProfit);

  if (compact) {
    return (
      <div className="rounded-xl border border-[#B8D0EB] bg-[#F0F5FB] p-4">
        <p className="text-xs font-medium text-[#2E4A63]">Estimated annual tax on £{fmt(annualProfit)} profit</p>
        <p className="mt-1 text-2xl font-bold text-[#0F1C2E]">£{fmt(t.totalTax)}</p>
        <p className="mt-0.5 text-xs text-[#5A7A9B]">
          Income Tax £{fmt(t.incomeTax)} · Class 4 NICs £{fmt(t.class4)} · {t.effectiveRate.toFixed(1)}% effective rate
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
          <p className="mt-0.5 text-lg font-bold text-[#0F1C2E]">£{fmt(t.class4)}</p>
        </div>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-[#5A7A9B]">Total</p>
          <p className="mt-0.5 text-lg font-bold text-[#2E88D0]">£{fmt(t.totalTax)}</p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between rounded-lg bg-white/60 px-3 py-2">
        <span className="text-xs text-[#2E4A63]">Effective tax rate</span>
        <span className="text-sm font-semibold text-[#0F1C2E]">{t.effectiveRate.toFixed(1)}%</span>
      </div>

      {t.class2 > 0 && (
        <p className="mt-2 text-[11px] text-[#5A7A9B]">
          Class 2 NICs (£{fmt(t.class2)}/year) are voluntary since April 2024 and not included above. You may choose to pay them to build state pension entitlement.
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
