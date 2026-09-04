import type { Metadata } from "next";
import { satoshi } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "pace — your money. your pace.",
  description: "A budgeting app that moves with you, not against you.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${satoshi.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-brand-paper text-brand-dark">{children}</body>
    </html>
  );
}
