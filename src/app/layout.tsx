import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Flonancial — MTD Quick Check",
  description: "MTD for Income Tax quick check. Bridging now, full accounts later.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-black text-white antialiased">
        {children}
      </body>
    </html>
  );
}