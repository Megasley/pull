import Link from "next/link";

import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/site-config";

export function SponsorSection() {
  return (
    <section className="border border-ink/20 bg-signal/10 p-6 sm:p-8">
      <p className="tech-eyebrow">partners // sponsor</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight">
        Sponsor Pull
      </h2>
      <p className="mt-3 max-w-2xl font-mono text-sm leading-relaxed text-muted-foreground">
        Interested in supporting developer education, open source contribution,
        and the next generation of builders? Contact us about sponsorship
        opportunities.
      </p>
      <Button asChild className="mt-6">
        <Link
          href={`mailto:${siteConfig.contactEmail}?subject=${encodeURIComponent("Sponsorship inquiry — Pull")}`}
        >
          Contact Us
        </Link>
      </Button>
    </section>
  );
}
