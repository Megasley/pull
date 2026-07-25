import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { GoogleAnalytics } from "@next/third-parties/google";
import { Analytics } from "@vercel/analytics/next";

import { SiteLayout } from "@/components/layout/site-layout";
import { siteConfig } from "@/lib/site-config";

import "@/styles/index.css";

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
    // Unique paths so Safari does not reuse a cached favicon URL.
    icon: [
      { url: "/pull-icon.png", type: "image/png", sizes: "32x32" },
      { url: "/pull-favicon.ico", sizes: "32x32" },
    ],
    apple: [
      {
        url: "/pull-apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
    shortcut: "/pull-favicon.ico",
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
    >
      <body className="flex min-h-full flex-col overflow-x-hidden font-sans text-foreground">
        <SiteLayout>{children}</SiteLayout>
        <Analytics />
        {gaId ? <GoogleAnalytics gaId={gaId} /> : null}
      </body>
    </html>
  );
}
