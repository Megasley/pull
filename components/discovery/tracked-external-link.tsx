"use client";

import type { AnchorHTMLAttributes } from "react";

import { recordDiscoveryClickAction } from "@/app/actions/opportunities";
import type { OpportunitySourceType } from "@/lib/opportunities/events";

type TrackedExternalLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  opportunityKey: string;
  sourceType: OpportunitySourceType;
  repoFullName?: string | null;
};

/** Fire-and-forget click tracking for outbound GitHub links on the general
 *  discovery catalog — see app/actions/opportunities.ts. Never blocks or
 *  delays navigation. */
export function TrackedExternalLink({
  opportunityKey,
  sourceType,
  repoFullName,
  onClick,
  ...anchorProps
}: TrackedExternalLinkProps) {
  return (
    <a
      {...anchorProps}
      onClick={(event) => {
        void recordDiscoveryClickAction({ opportunityKey, sourceType, repoFullName });
        onClick?.(event);
      }}
    />
  );
}
