import { BetaBanner } from "@/components/layout/beta-banner";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";

type SiteLayoutProps = {
  children: React.ReactNode;
};

export function SiteLayout({ children }: SiteLayoutProps) {
  return (
    <>
      <BetaBanner />
      <Navbar />
      <main className="min-w-0 flex-1">{children}</main>
      <Footer />
    </>
  );
}
