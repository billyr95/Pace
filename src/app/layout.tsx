import type { Metadata, Viewport } from "next";
import { satoshi } from "@/lib/fonts";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

const SITE_URL = "https://www.pace-budget.xyz";
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

// interactiveWidget: "resizes-content" makes the layout viewport actually shrink when the
// on-screen keyboard opens, instead of just overlaying it — without this, fixed-positioned
// UI anchored to the bottom of the screen (Sheet content, in particular) ends up rendered
// behind the keyboard on iOS/Android rather than pushed up above it.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  interactiveWidget: "resizes-content",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn("h-full", "antialiased", satoshi.variable)} suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-page text-ink">
        <ThemeProvider>
          <TooltipProvider>{children}</TooltipProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
