/**
 * First-touch acquisition capture — set once, at account creation, in
 * lib/auth/ensure-builder-profile.ts. Never overwritten afterward.
 *
 * Deliberately reuses the existing `next` redirect param (see
 * lib/auth/routes.ts:sanitizeRedirectPath, which already preserves query
 * strings) rather than adding cookies, middleware, or a new tracking
 * library. Whatever page a visitor lands on before signing in can carry
 * `next=<path>?utm_source=...` or `next=/invite/<token>` straight through
 * the GitHub OAuth round trip to this point.
 *
 * "organic" (arrived via a search engine) is intentionally NOT auto-detected
 * here — that would require capturing the HTTP Referer header, which this
 * codebase doesn't do today. Rather than guess, unrecognized traffic is
 * "direct" and "organic" stays available for manual/future classification.
 * See docs/metrics-definitions.md.
 */

export type AcquisitionSource =
  | "direct"
  | "organic"
  | "referral"
  | "partner"
  | "program"
  | "bootcamp"
  | "campaign"
  | "other";

export type AcquisitionSignal = {
  source: AcquisitionSource;
  detail: Record<string, unknown>;
};

export function deriveAcquisitionSignal(nextPath: string | null | undefined): AcquisitionSignal {
  const path = nextPath ?? "/dashboard";

  if (path.startsWith("/invite/")) {
    // Which partner is resolved separately once the invite is actually
    // redeemed (org_memberships) — this only records *that* the signup was
    // partner-invite-shaped, not raw token material.
    return { source: "partner", detail: { via: "invite_link" } };
  }

  let query: URLSearchParams;
  try {
    query = new URL(path, "https://placeholder.invalid").searchParams;
  } catch {
    return { source: "direct", detail: {} };
  }

  const utmSource = query.get("utm_source");
  const utmMedium = query.get("utm_medium");
  const utmCampaign = query.get("utm_campaign");
  const ref = query.get("ref");

  if (utmSource || utmMedium || utmCampaign) {
    return {
      source: "campaign",
      detail: {
        ...(utmSource ? { utmSource } : {}),
        ...(utmMedium ? { utmMedium } : {}),
        ...(utmCampaign ? { utmCampaign } : {}),
      },
    };
  }

  if (ref) {
    return { source: "referral", detail: { ref } };
  }

  return { source: "direct", detail: {} };
}
