import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/design-system";
import {
  attributionGroups,
  PULL_CURRICULUM_LICENSE,
  PULL_SOFTWARE_LICENSE,
  type Attribution,
} from "@/lib/attributions";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Credits & licensing",
  description: `Licensing for ${siteConfig.name} and attribution for the third-party books, specifications, and tools its curriculum links to.`,
  alternates: { canonical: "/credits" },
};

const externalLinkClass =
  "text-foreground underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none";

function SourceRow({ item }: { item: Attribution }) {
  return (
    <li className="border-t border-border py-5 first:border-t-0 first:pt-0">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <a
          href={item.href}
          target="_blank"
          rel="noreferrer"
          className={`text-sm font-semibold ${externalLinkClass}`}
        >
          {item.name}
        </a>
        {item.licenseHref ? (
          <a
            href={item.licenseHref}
            target="_blank"
            rel="noreferrer"
            className="font-mono text-[11px] tracking-wide text-muted-foreground underline decoration-border underline-offset-4 hover:text-foreground"
          >
            {item.license}
          </a>
        ) : (
          <span className="font-mono text-[11px] tracking-wide text-muted-foreground">
            {item.license}
          </span>
        )}
      </div>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.authors}</p>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.usage}</p>
    </li>
  );
}

export default function CreditsPage() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col px-4 py-16 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="legal // credits"
        title="Credits & licensing"
        description="Pull's application code is MIT and its curriculum is CC BY-SA 4.0. The third-party books, specifications, and tools that lessons link to stay under their own licenses."
      />

      <section className="mt-12 space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">
          What is covered by which license
        </h2>
        <div className="space-y-3 text-sm leading-7 text-muted-foreground">
          <p>
            <strong className="text-foreground">Application code</strong> — everything
            in the Pull repository that makes the product run is released under the{" "}
            <a
              href={PULL_SOFTWARE_LICENSE.href}
              target="_blank"
              rel="noreferrer"
              className={externalLinkClass}
            >
              {PULL_SOFTWARE_LICENSE.spdx} License
            </a>
            . Fork it, self-host it, or build on it.
          </p>
          <p>
            <strong className="text-foreground">Pull curriculum</strong> — lesson text,
            roadmap structure, project specs, and original diagrams are written by Pull
            contributors and released under{" "}
            <a
              href={PULL_CURRICULUM_LICENSE.href}
              target="_blank"
              rel="noreferrer"
              className={externalLinkClass}
            >
              {PULL_CURRICULUM_LICENSE.spdx}
            </a>
            . Reuse and adapt it with credit to Pull, and keep derivative curriculum
            under the same license.
          </p>
          <p>
            <strong className="text-foreground">Third-party works</strong> — books,
            specifications, documentation, and tools listed below are owned by their
            authors and licensed on their own terms. Pull links to them. It does not
            mirror, fork, or republish them, and linking does not relicense them.
          </p>
          <p>
            <strong className="text-foreground">Brand</strong> — the Pull name,
            wordmark, and logo files are not covered by either license.
          </p>
        </div>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">
          How the curriculum uses external sources
        </h2>
        <ul className="list-disc space-y-2 pl-5 text-sm leading-7 text-muted-foreground">
          <li>
            Required reading is a deep link to the source, never a copy of its text.
          </li>
          <li>
            Interactive labs open on the publisher&apos;s own site; Pull tracks only
            your completion state.
          </li>
          <li>
            Explanations are written in Pull&apos;s own words. Direct quotes, if any,
            are short and attributed inline.
          </li>
          <li>
            Diagrams under <code className="font-mono text-xs">public/</code> are
            original to Pull unless the lesson credits another source.
          </li>
        </ul>
      </section>

      {attributionGroups.map((group) => (
        <section key={group.id} className="mt-12 space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">{group.title}</h2>
          <p className="text-sm leading-7 text-muted-foreground">{group.description}</p>
          <ul className="mt-2">
            {group.items.map((item) => (
              <SourceRow key={item.href} item={item} />
            ))}
          </ul>
        </section>
      ))}

      <section className="mt-12 space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">
          Something missing or wrong?
        </h2>
        <p className="text-sm leading-7 text-muted-foreground">
          If you maintain a project listed here and want the attribution corrected, the
          license updated, or the reference removed, email{" "}
          <a href={`mailto:${siteConfig.contactEmail}`} className={externalLinkClass}>
            {siteConfig.contactEmail}
          </a>{" "}
          or open an issue on the repository. Licenses are recorded as published
          upstream at the time of writing — always check the source for the current
          terms.
        </p>
      </section>

      <div className="mt-14 border-t border-border pt-6">
        <p className="font-mono text-xs text-muted-foreground">
          See also{" "}
          <Link href="/terms" className={externalLinkClass}>
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className={externalLinkClass}>
            Privacy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
