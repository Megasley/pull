import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import Script from "next/script";
import { GoogleAnalytics } from "@next/third-parties/google";
import { Analytics } from "@vercel/analytics/next";

import { SiteLayout } from "@/components/layout/site-layout";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { DEV_CHUNK_RECOVERY_SCRIPT } from "@/lib/dev/chunk-error-recovery";
import { siteConfig } from "@/lib/site-config";

import "@/app/globals.css";

const spaceGrotesk = localFont({
  src: "./fonts/SpaceGrotesk-Variable.woff2",
  variable: "--font-sans",
  weight: "400 700",
  display: "swap",
});

const geistMono = localFont({
  src: "./fonts/GeistMono-Variable.woff2",
  variable: "--font-geist-mono",
  weight: "100 900",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.description,
  icons: {
    // Unique paths so Safari does not reuse a cached favicon URL — bumped to
    // -v2 for the terminal-prompt redesign so browsers don't keep showing
    // the old mark from cache.
    icon: [
      { url: "/pull-icon-v2.png", type: "image/png", sizes: "32x32" },
      { url: "/pull-favicon-v2.ico", sizes: "32x32" },
    ],
    apple: [
      {
        url: "/pull-apple-touch-icon-v2.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
    shortcut: "/pull-favicon-v2.ico",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${spaceGrotesk.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col overflow-x-hidden font-sans text-foreground">
        {process.env.NODE_ENV === "development" ? (
          <Script id="pull-chunk-recovery" strategy="beforeInteractive">
            {DEV_CHUNK_RECOVERY_SCRIPT}
          </Script>
        ) : null}
        <ThemeProvider>
          <SiteLayout>{children}</SiteLayout>
        </ThemeProvider>
        <Analytics />
        {gaId ? <GoogleAnalytics gaId={gaId} /> : null}
      </body>
    </html>
  );
}
