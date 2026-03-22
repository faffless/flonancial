import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Log In — Flonancial",
  description: "Log in to Flonancial to manage your Making Tax Digital quarterly submissions.",
  alternates: { canonical: "https://flonancial.co.uk/login" },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
