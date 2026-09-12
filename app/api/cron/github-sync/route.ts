import { NextResponse, after } from "next/server";

import { syncDueGithubConnections } from "@/lib/github";

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * Background GitHub sync cron.
 * Secure with Authorization: Bearer $CRON_SECRET (Vercel Cron injects this).
 *
 * Syncing due connections can take longer than external schedulers are
 * willing to wait on a single request (e.g. cron-job.org's ~30s timeout), so
 * the sync itself runs in `after()` — the response returns immediately while
 * the work continues for up to `maxDuration`.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");

  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  after(async () => {
    try {
      const results = await syncDueGithubConnections(15);
      const ok = results.filter((item) => item.ok).length;
      const failed = results.filter((item) => !item.ok).length;

      console.info("[github-cron]", { synced: ok, failed, total: results.length });
    } catch (error) {
      console.error("[github-cron]", error);
    }
  });

  return NextResponse.json({ ok: true, scheduled: true });
}
