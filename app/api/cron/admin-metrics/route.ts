import { NextResponse } from "next/server";

import { refreshAdminMetricsSnapshot } from "@/lib/admin/metrics-snapshot";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Refresh admin overview aggregates (funnel, MAU, drop-off, role counts).
 * Secure with Authorization: Bearer $CRON_SECRET (Vercel Cron injects this).
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");

  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await refreshAdminMetricsSnapshot();
    console.info("[admin-metrics-cron]", result);

    return NextResponse.json(
      {
        ok: result.ok,
        computedAt: result.computedAt,
        error: result.error ?? null,
      },
      { status: result.ok ? 200 : 500 },
    );
  } catch (error) {
    console.error("[admin-metrics-cron]", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Cron metrics failed",
      },
      { status: 500 },
    );
  }
}
