import { Suspense } from "react";

import { BetaBanner } from "@/components/layout/beta-banner";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { NavigationProgress } from "@/components/layout/navigation-progress";
import { PlatformBanners } from "@/components/platform/platform-banners";

type SiteLayoutProps = {
  children: React.ReactNode;
};

export function SiteLayout({ children }: SiteLayoutProps) {
  return (
    <>
      <Suspense fallback={null}>
        <NavigationProgress />
      </Suspense>
      <BetaBanner />
      <PlatformBanners />
      <Navbar />
      <main className="flex min-h-0 min-w-0 flex-1 flex-col">{children}</main>
      <Footer />
    </>
  );
}
