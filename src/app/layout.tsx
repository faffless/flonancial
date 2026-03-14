import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Flonancial — Free MTD tax submissions for the self-employed",
  description: "Submit your quarterly Making Tax Digital updates directly to HMRC. Free during beta. No accountant needed.",
  icons: {
    icon: "/brand/990.png",
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
      </body>
    </html>
  );
}