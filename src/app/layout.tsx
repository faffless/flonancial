import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";

import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Flonancial — Free MTD tax submissions for the self-employed",
  description: "Submit your quarterly Making Tax Digital updates directly to HMRC. Completely free. No accountant needed.",
  alternates: { canonical: "https://flonancial.co.uk" },
  icons: {
    icon: "/brand/990.png",
  },
  openGraph: {
    title: "Flonancial — Free MTD tax submissions for the self-employed",
    description: "Submit your quarterly Making Tax Digital updates directly to HMRC. Completely free. No accountant needed.",
    url: "https://flonancial.co.uk",
    siteName: "Flonancial",
    type: "website",
    locale: "en_GB",
    images: [
      {
        url: "https://flonancial.co.uk/brand/logo.png",
        alt: "Flonancial",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Flonancial — Free MTD tax submissions for the self-employed",
    description: "Submit your quarterly Making Tax Digital updates directly to HMRC. Completely free. No accountant needed.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${plusJakarta.className} min-h-screen bg-[#DEE9F8] text-[#0F1C2E] antialiased`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}