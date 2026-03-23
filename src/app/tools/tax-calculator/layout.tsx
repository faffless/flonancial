import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "UK Tax Calculator 2025–26 — Income Tax, NI & Student Loans | Flonancial",
  description:
    "Free UK tax calculator for 2025–26. Works for employed and self-employed. Calculate income tax, National Insurance, student loan repayments, pension relief, and take-home pay.",
  openGraph: {
    title: "UK Tax Calculator 2025–26 — Flonancial",
    description:
      "Free tax calculator for employed and self-employed. Income tax, NI, student loans, pension — all 2025–26 rates.",
    url: "https://flonancial.co.uk/tools/tax-calculator",
  },
};

export default function TaxCalculatorLayout({ children }: { children: React.ReactNode }) {
  return children;
}
