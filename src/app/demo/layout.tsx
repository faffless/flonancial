import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Demo — Flonancial",
  description: "Try the Flonancial demo. See how Making Tax Digital quarterly submissions work before creating an account.",
  alternates: { canonical: "https://flonancial.co.uk/demo" },
};

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
