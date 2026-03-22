import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up — Flonancial",
  description: "Create a free Flonancial account and start submitting your Making Tax Digital quarterly updates to HMRC.",
  alternates: { canonical: "https://flonancial.co.uk/signup" },
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
