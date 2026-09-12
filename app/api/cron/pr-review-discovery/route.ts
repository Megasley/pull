import { NextResponse } from "next/server";

import { GithubClient } from "@/lib/github/client";
import { discoverEcosystemReviewRequests } from "@/lib/pr-reviews/discovery";
import { refreshStaleRequests } from "@/lib/pr-reviews/repository";

export const runtime = "nodejs";
export const maxDuration = 60;

const STALE_REFRESH_BUDGET = 30;

/**
 * Background PR-review-queue maintenance cron: auto-discovers ecosystem PRs
 * needing review (lib/pr-reviews/discovery.ts) and closes out requests for
 * PRs that have since been merged/closed elsewhere.
 * Secure with Authorization: Bearer $CRON_SECRET (Vercel Cron injects this).
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");

  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const discovery = await discoverEcosystemReviewRequests();

    const client = new GithubClient(process.env.GITHUB_DISCOVERY_TOKEN ?? "");
    const staleness = await refreshStaleRequests({
      client,
      budget: STALE_REFRESH_BUDGET,
    });

    console.info("[pr-review-discovery-cron]", { discovery, staleness });

    return NextResponse.json({ ok: true, discovery, staleness });
  } catch (error) {
    console.error("[pr-review-discovery-cron]", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "PR review discovery cron failed",
      },
      { status: 500 },
    );
  }
}
