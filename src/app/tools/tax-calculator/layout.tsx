import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Self-Employed Tax Calculator 2025–26 — Flonancial",
  description:
    "Free self-employed tax calculator for 2025–26. Estimate your income tax and National Insurance as a sole trader or landlord. Includes Class 4 NICs, Personal Allowance taper, and all current rates.",
  openGraph: {
    title: "Self-Employed Tax Calculator 2025–26 — Flonancial",
    description:
      "Free self-employed tax calculator for 2025–26. Estimate your income tax and National Insurance.",
    url: "https://flonancial.co.uk/tools/tax-calculator",
  },
};

export default function TaxCalculatorLayout({ children }: { children: React.ReactNode }) {
  return children;
}
