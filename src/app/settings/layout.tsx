import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings — Flonancial",
  description: "Manage your Flonancial account settings, change your email or password, and download your data.",
};

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
