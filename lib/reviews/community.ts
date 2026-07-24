import { and, eq } from "drizzle-orm";

import { isReviewerRole } from "@/lib/auth/roles";
import { getDb } from "@/lib/db";
import { isDatabaseConfigured } from "@/lib/db/env";
import { projectSubmissions } from "@/lib/db/schema";
import { getReputationScore } from "@/lib/reputation";
import type { UserRole } from "@/types/submission";

export function getRequiredApprovals(): number {
  const raw = Number(process.env.PULL_PEER_REVIEW_REQUIRED_APPROVALS ?? "2");
  return Number.isFinite(raw) && raw >= 1 ? Math.floor(raw) : 2;
}

export function getClaimMinutes(): number {
  const raw = Number(process.env.PULL_PEER_REVIEW_CLAIM_MINUTES ?? "20");
  return Number.isFinite(raw) && raw >= 5 ? Math.floor(raw) : 20;
}

export function getReputationThreshold(): number {
  const raw = Number(process.env.PULL_PEER_REVIEW_REPUTATION_MIN ?? "40");
  return Number.isFinite(raw) && raw >= 0 ? Math.floor(raw) : 40;
}

export type PeerReviewContext = {
  userId: string;
  role: UserRole;
  isStaff: boolean;
  reputation: number;
  approvedProjectIds: Set<string>;
};

export async function loadPeerReviewContext(
  userId: string,
  role: UserRole,
): Promise<PeerReviewContext> {
  const isStaff = isReviewerRole(role);
  const approvedProjectIds = await listApprovedProjectIdsForUser(userId);
  const reputation = isStaff ? 0 : await getReputationScore(userId);

  return {
    userId,
    role,
    isStaff,
    reputation,
    approvedProjectIds,
  };
}

async function listApprovedProjectIdsForUser(userId: string): Promise<Set<string>> {
  if (!isDatabaseConfigured()) {
    return new Set();
  }

  const db = getDb();
  const rows = await db
    .select({ projectId: projectSubmissions.projectId })
    .from(projectSubmissions)
    .where(
      and(
        eq(projectSubmissions.userId, userId),
        eq(projectSubmissions.status, "approved"),
      ),
    );

  return new Set(rows.map((row) => row.projectId));
}

export function isEligiblePeer(
  ctx: PeerReviewContext,
  submission: { userId: string; projectId: string },
): boolean {
  if (submission.userId === ctx.userId) {
    return false;
  }

  if (ctx.isStaff) {
    return true;
  }

  if (ctx.approvedProjectIds.has(submission.projectId)) {
    return true;
  }

  return ctx.reputation >= getReputationThreshold();
}

export function eligibilityLabel(
  ctx: PeerReviewContext,
  submission: { userId: string; projectId: string },
): string | null {
  if (submission.userId === ctx.userId) {
    return "own_submission";
  }
  if (ctx.isStaff) {
    return "staff";
  }
  if (ctx.approvedProjectIds.has(submission.projectId)) {
    return "completed_project";
  }
  if (ctx.reputation >= getReputationThreshold()) {
    return "reputation";
  }
  return null;
}

export function isClaimActive(input: {
  claimedBy: string | null;
  claimExpiresAt: string | null;
  now?: Date;
}): boolean {
  if (!input.claimedBy || !input.claimExpiresAt) {
    return false;
  }

  const now = input.now ?? new Date();
  return new Date(input.claimExpiresAt).getTime() > now.getTime();
}

export function claimExpiresAtIso(from = new Date()): string {
  const expires = new Date(from.getTime() + getClaimMinutes() * 60_000);
  return expires.toISOString();
}
