import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { requireAdmin } from "@/app/actions/admin";
import { refreshAdminMetricsSnapshot } from "@/lib/admin/metrics-snapshot";

export const runtime = "nodejs";
// Computing the full admin metrics snapshot (growth, contributors,
// attribution, geography, retention, learning funnel, drop-off) can take
// longer than the /admin page's own maxDuration=30 — which is deliberately
// tight so the page itself always loads fast and degrades gracefully. A
// Server Action inherits its page's maxDuration (Next.js has no per-action
// override), so the manual "Refresh metrics" trigger lives in its own route
// instead, with a budget sized for the actual work rather than the page.
export const maxDuration = 300;

/** Manually recompute the admin metrics snapshot (same work as the daily
 *  cron) on behalf of a signed-in admin — see RefreshAdminMetricsButton. */
export async function POST() {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return NextResponse.json({ ok: false, reason: gate.reason }, { status: 403 });
  }

  const result = await refreshAdminMetricsSnapshot();
  revalidatePath("/admin");

  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        reason: "refresh_failed",
        error: result.error ?? "Could not refresh metrics.",
        computedAt: result.computedAt,
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, computedAt: result.computedAt });
}
