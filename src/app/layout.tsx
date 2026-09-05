import type { Metadata } from "next";
import { satoshi } from "@/lib/fonts";
import "./globals.css";

const SITE_URL = "https://pace-nine-zeta.vercel.app";
const TITLE = "pace — your money. your pace.";
const DESCRIPTION = "A budgeting app that moves with you, not against you.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: "pace",
    type: "website",
    images: [{ url: "/brand/pace-logocard.png", width: 1200, height: 681, alt: "pace" }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/brand/pace-logocard.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${satoshi.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-brand-paper text-brand-dark">{children}</body>
    </html>
  );
}
