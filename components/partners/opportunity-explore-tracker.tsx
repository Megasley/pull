"use client";

import { useRef } from "react";

import { recordOpportunityExploredAction } from "@/app/actions/hub";

type OpportunityExploreTrackerProps = {
  orgSlug: string;
  children: React.ReactNode;
};

/**
 * Wraps the opportunities region and records "explored" the first time the
 * member clicks any link inside — via event delegation, so the repo/issue
 * card components underneath stay untouched and reusable elsewhere.
 */
export function OpportunityExploreTracker({ orgSlug, children }: OpportunityExploreTrackerProps) {
  const firedRef = useRef(false);

  return (
    <div
      onClick={(event) => {
        if (firedRef.current) return;
        const anchor = (event.target as HTMLElement).closest("a");
        if (!anchor) return;

        firedRef.current = true;
        void recordOpportunityExploredAction(orgSlug, anchor.href);
      }}
    >
      {children}
    </div>
  );
}
