import { NextResponse } from "next/server";

import { notifyPrReviewDigest } from "@/lib/notifications/dispatch";
import { listReviewRequestsForViewer } from "@/lib/pr-reviews/repository";

export const runtime = "nodejs";
export const maxDuration = 60;

const DIGEST_SIZE = 5;

/**
 * Weekly nudge to everyone opted into `prReviewDigest` (Settings →
 * Notifications), featuring the oldest-waiting PRs from the public queue —
 * same ordering `listReviewRequestsForViewer` already uses (peer-submitted
 * first, then oldest first), just the top few. Not personalized by
 * language/track; see recommendation in the pr-reviews session notes for a
 * possible future refinement.
 * Secure with Authorization: Bearer $CRON_SECRET.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");

  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const requests = await listReviewRequestsForViewer(null);
    const items = requests.slice(0, DIGEST_SIZE).map((request) => ({
      repoFullName: request.repoFullName,
      number: request.number,
      title: request.title,
      prUrl: request.prUrl,
    }));

    const result = await notifyPrReviewDigest(items);

    console.info("[pr-review-digest-cron]", { featured: items.length, ...result });

    return NextResponse.json({ ok: true, featured: items.length, ...result });
  } catch (error) {
    console.error("[pr-review-digest-cron]", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "PR review digest cron failed",
      },
      { status: 500 },
    );
  }
}
