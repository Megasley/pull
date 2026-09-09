import { track } from "@vercel/analytics/server";

import type { FirstContributionEventName } from "./analytics";

type EventProperties = Record<string, string | number | boolean | null>;

/** Server-side sender for First Contribution analytics events (server actions,
 *  GitHub sync). Fire-and-forget: an analytics outage must never fail the
 *  request or sync it's attached to, so failures are logged and swallowed —
 *  same non-critical-side-effect pattern as lib/admin/analytics.ts. */
export async function trackFirstContributionEvent(
  name: FirstContributionEventName,
  properties?: EventProperties,
): Promise<void> {
  try {
    await track(name, properties);
  } catch (error) {
    console.warn(`[first-contribution] analytics track failed: ${name}`, error);
  }
}
