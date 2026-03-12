import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Flonancial — MTD Quick Check",
  description: "MTD for Income Tax quick check. Bridging now, full accounts later.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${manrope.className} min-h-screen bg-black text-white antialiased`}
      >
        {children}
      </body>
    </html>
  );
}