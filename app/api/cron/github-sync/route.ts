import { NextResponse } from "next/server";

import { syncDueGithubConnections } from "@/lib/github";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Background GitHub sync cron.
 * Secure with Authorization: Bearer $CRON_SECRET (Vercel Cron injects this).
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");

  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const results = await syncDueGithubConnections(15);
    const ok = results.filter((item) => item.ok).length;
    const failed = results.filter((item) => !item.ok).length;

    console.info("[github-cron]", { synced: ok, failed, total: results.length });

    return NextResponse.json({
      ok: true,
      synced: ok,
      failed,
      results,
    });
  } catch (error) {
    console.error("[github-cron]", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Cron sync failed",
      },
      { status: 500 },
    );
  }
}
