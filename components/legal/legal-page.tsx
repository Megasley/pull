import Link from "next/link";

import { Eyebrow, H1, H2, Muted } from "@/components/design-system";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";

type LegalSection = {
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

type LegalPageProps = {
  eyebrow: string;
  title: string;
  summary: string;
  effectiveDate: string;
  sections: LegalSection[];
  className?: string;
};

export function LegalPage({
  eyebrow,
  title,
  summary,
  effectiveDate,
  sections,
  className,
}: LegalPageProps) {
  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-3xl flex-col px-4 py-16 sm:px-6 lg:px-8",
        className,
      )}
    >
      <Eyebrow className="mb-4">{eyebrow}</Eyebrow>
      <H1>{title}</H1>
      <p className="mt-4 font-mono text-sm leading-relaxed text-muted-foreground sm:text-base">
        {summary}
      </p>
      <Muted className="mt-3 font-mono text-xs">
        Effective date: {effectiveDate} · {siteConfig.name}
      </Muted>

      <div className="mt-12 space-y-10">
        {sections.map((section) => (
          <section key={section.title} className="space-y-3">
            <H2 className="text-xl">{section.title}</H2>
            {section.paragraphs.map((paragraph) => (
              <p
                key={paragraph}
                className="text-sm leading-7 text-muted-foreground sm:text-[0.95rem]"
              >
                {paragraph}
              </p>
            ))}
            {section.bullets && section.bullets.length > 0 ? (
              <ul className="list-disc space-y-2 pl-5 text-sm leading-7 text-muted-foreground">
                {section.bullets.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}
      </div>

      <div className="mt-14 border-t border-border pt-6">
        <p className="font-mono text-xs text-muted-foreground">
          Questions? Reach out via the contact details on{" "}
          <Link
            href="/sign-in"
            className="text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground"
          >
            the product surface
          </Link>{" "}
          once support channels are published, or review{" "}
          <Link
            href="/privacy"
            className="text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground"
          >
            Privacy
          </Link>{" "}
          and{" "}
          <Link
            href="/terms"
            className="text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground"
          >
            Terms
          </Link>
          .
        </p>
        <p className="mt-3 font-mono text-[11px] text-muted-foreground">
          This page is a product disclosure for Pull. It is not personalized legal
          advice.
        </p>
      </div>
    </div>
  );
}
