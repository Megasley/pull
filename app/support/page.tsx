import type { Metadata } from "next";
import Link from "next/link";
import { Zap } from "lucide-react";

import { PageHeader } from "@/components/design-system";
import { DonationMethods } from "@/components/support/donation-methods";
import { SponsorSection } from "@/components/support/sponsor-section";
import { SupportersWall } from "@/components/support/supporters-wall";
import { Button } from "@/components/ui/button";
import { isBlinkReceiveConfigured } from "@/lib/blink/env";
import { getSupportPublicConfig } from "@/lib/support/config";
import { listPublicSupporters } from "@/lib/support/repository";

export const metadata: Metadata = {
  title: "Support Pull",
  description:
    "Fund Pull’s development with Bitcoin — Lightning, on-chain, or Silent Payments.",
  alternates: { canonical: "/support" },
};

export const dynamic = "force-dynamic";

async function loadSupporters() {
  try {
    return await listPublicSupporters(24);
  } catch {
    return [];
  }
}

export default async function SupportPage() {
  const config = getSupportPublicConfig(isBlinkReceiveConfigured());
  const supporters = await loadSupporters();

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-16 px-4 py-16 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="bitcoin // support"
        title="Support Pull"
        description="Pull is building infrastructure that helps developers learn, contribute to open source, and build a public reputation through real work. Your support helps us continue building and improving the platform."
        actions={
          <Button asChild size="lg">
            <Link href="#donate">
              <Zap aria-hidden />
              Support with Bitcoin
            </Link>
          </Button>
        }
      />

      <DonationMethods
        lightningEnabled={config.lightningEnabled}
        onchainAddress={config.onchainAddress}
        silentPaymentAddress={config.silentPaymentAddress}
      />

      <SupportersWall supporters={supporters} />

      <SponsorSection />
    </div>
  );
}
