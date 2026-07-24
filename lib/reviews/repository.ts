import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { isDatabaseConfigured } from "@/lib/db/env";
import {
  projectSubmissions,
  projects,
  submissionReviewEvents,
  submissionReviews,
  users,
} from "@/lib/db/schema";
import {
  claimExpiresAtIso,
  getRequiredApprovals,
  isClaimActive,
  isEligiblePeer,
  loadPeerReviewContext,
} from "@/lib/reviews/community";
import type {
  ProjectSubmissionRecord,
  ReviewAction,
  ReviewDecision,
  ReviewTimelineEvent,
  SubmissionStatus,
  UserRole,
} from "@/types/submission";
import { REVIEW_QUEUE_STATUSES } from "@/types/submission";

function nowIso() {
  return new Date().toISOString();
}

function mapSubmission(
  row: typeof projectSubmissions.$inferSelect,
  project: { slug: string; title: string },
  builder?: {
    username: string;
    displayName: string;
    avatar: string | null;
  },
  extras?: {
    approvalCount?: number;
    requiredApprovals?: number;
    myDecision?: ReviewDecision | null;
  },
): ProjectSubmissionRecord {
  return {
    id: row.id,
    userId: row.userId,
    projectId: row.projectId,
    projectSlug: project.slug,
    projectTitle: project.title,
    status: row.status,
    repoUrl: row.repoUrl,
    prUrl: row.prUrl,
    liveDemoUrl: row.liveDemoUrl,
    videoDemoUrl: row.videoDemoUrl,
    screenshotUrls: row.screenshotUrls ?? [],
    notes: row.notes,
    submittedAt: row.submittedAt,
    reviewedAt: row.reviewedAt,
    reviewRound: row.reviewRound,
    claimedBy: row.claimedBy,
    claimExpiresAt: row.claimExpiresAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    builderUsername: builder?.username,
    builderDisplayName: builder?.displayName,
    builderAvatar: builder?.avatar,
    approvalCount: extras?.approvalCount,
    requiredApprovals: extras?.requiredApprovals ?? getRequiredApprovals(),
    myDecision: extras?.myDecision,
  };
}

async function appendEvent(input: {
  submissionId: string;
  actorUserId: string | null;
  type: "status_change" | "comment";
  fromStatus?: SubmissionStatus | null;
  toStatus?: SubmissionStatus | null;
  body?: string;
}) {
  const db = getDb();
  await db.insert(submissionReviewEvents).values({
    submissionId: input.submissionId,
    actorUserId: input.actorUserId,
    type: input.type,
    fromStatus: input.fromStatus ?? null,
    toStatus: input.toStatus ?? null,
    body: input.body ?? "",
  });
}

export async function recordSubmissionEvent(input: {
  submissionId: string;
  actorUserId: string | null;
  type: "status_change" | "comment";
  fromStatus?: SubmissionStatus | null;
  toStatus?: SubmissionStatus | null;
  body?: string;
}) {
  if (!isDatabaseConfigured()) {
    return;
  }

  await appendEvent(input);
}

async function countApprovalsForRound(
  submissionId: string,
  reviewRound: number,
): Promise<number> {
  const db = getDb();
  const rows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(submissionReviews)
    .where(
      and(
        eq(submissionReviews.submissionId, submissionId),
        eq(submissionReviews.reviewRound, reviewRound),
        eq(submissionReviews.decision, "approve"),
      ),
    );

  return rows[0]?.count ?? 0;
}

async function getMyDecision(
  submissionId: string,
  reviewRound: number,
  reviewerId: string,
): Promise<ReviewDecision | null> {
  const db = getDb();
  const rows = await db
    .select({ decision: submissionReviews.decision })
    .from(submissionReviews)
    .where(
      and(
        eq(submissionReviews.submissionId, submissionId),
        eq(submissionReviews.reviewRound, reviewRound),
        eq(submissionReviews.reviewerId, reviewerId),
      ),
    )
    .limit(1);

  return rows[0]?.decision ?? null;
}

async function enrichSubmission(
  record: ProjectSubmissionRecord,
  viewerId?: string,
): Promise<ProjectSubmissionRecord> {
  const approvalCount = await countApprovalsForRound(
    record.id,
    record.reviewRound,
  );
  const myDecision = viewerId
    ? await getMyDecision(record.id, record.reviewRound, viewerId)
    : null;

  return {
    ...record,
    approvalCount,
    requiredApprovals: getRequiredApprovals(),
    myDecision,
  };
}

export async function listReviewQueue(
  viewerId?: string,
): Promise<ProjectSubmissionRecord[]> {
  if (!isDatabaseConfigured()) {
    return [];
  }

  const db = getDb();
  const rows = await db
    .select({
      submission: projectSubmissions,
      projectSlug: projects.slug,
      projectTitle: projects.title,
      builderUsername: users.username,
      builderDisplayName: users.displayName,
      builderAvatar: users.avatar,
    })
    .from(projectSubmissions)
    .innerJoin(projects, eq(projectSubmissions.projectId, projects.id))
    .innerJoin(users, eq(projectSubmissions.userId, users.id))
    .where(inArray(projectSubmissions.status, REVIEW_QUEUE_STATUSES))
    .orderBy(asc(projectSubmissions.submittedAt), desc(projectSubmissions.updatedAt));

  const mapped = rows.map((row) =>
    mapSubmission(
      row.submission,
      {
        slug: row.projectSlug,
        title: row.projectTitle,
      },
      {
        username: row.builderUsername,
        displayName: row.builderDisplayName,
        avatar: row.builderAvatar,
      },
    ),
  );

  return Promise.all(mapped.map((item) => enrichSubmission(item, viewerId)));
}

export async function getSubmissionForReview(
  submissionId: string,
  viewerId?: string,
): Promise<ProjectSubmissionRecord | null> {
  if (!isDatabaseConfigured()) {
    return null;
  }

  const db = getDb();
  const rows = await db
    .select({
      submission: projectSubmissions,
      projectSlug: projects.slug,
      projectTitle: projects.title,
      builderUsername: users.username,
      builderDisplayName: users.displayName,
      builderAvatar: users.avatar,
    })
    .from(projectSubmissions)
    .innerJoin(projects, eq(projectSubmissions.projectId, projects.id))
    .innerJoin(users, eq(projectSubmissions.userId, users.id))
    .where(eq(projectSubmissions.id, submissionId))
    .limit(1);

  const row = rows[0];
  if (!row) {
    return null;
  }

  const mapped = mapSubmission(
    row.submission,
    { slug: row.projectSlug, title: row.projectTitle },
    {
      username: row.builderUsername,
      displayName: row.builderDisplayName,
      avatar: row.builderAvatar,
    },
  );

  return enrichSubmission(mapped, viewerId);
}

export async function listSubmissionTimeline(
  submissionId: string,
): Promise<ReviewTimelineEvent[]> {
  if (!isDatabaseConfigured()) {
    return [];
  }

  const db = getDb();
  const rows = await db
    .select({
      event: submissionReviewEvents,
      actorDisplayName: users.displayName,
      actorUsername: users.username,
    })
    .from(submissionReviewEvents)
    .leftJoin(users, eq(submissionReviewEvents.actorUserId, users.id))
    .where(eq(submissionReviewEvents.submissionId, submissionId))
    .orderBy(asc(submissionReviewEvents.createdAt));

  return rows.map((row) => ({
    id: row.event.id,
    submissionId: row.event.submissionId,
    actorUserId: row.event.actorUserId,
    actorDisplayName: row.actorDisplayName,
    actorUsername: row.actorUsername,
    type: row.event.type,
    fromStatus: row.event.fromStatus,
    toStatus: row.event.toStatus,
    body: row.event.body,
    createdAt: row.event.createdAt,
  }));
}

export type ReviewMutationResult =
  | { ok: true; submission: ProjectSubmissionRecord }
  | {
      ok: false;
      reason:
        | "database_unconfigured"
        | "not_found"
        | "invalid_transition"
        | "comment_required"
        | "not_eligible"
        | "own_submission"
        | "claim_locked"
        | "staff_only";
    };

function canTransition(status: SubmissionStatus, action: ReviewAction): boolean {
  switch (action) {
    case "start_review":
      return (
        status === "submitted" ||
        status === "needs_changes" ||
        status === "under_review"
      );
    case "approve":
    case "reject":
    case "request_changes":
      return (
        status === "submitted" ||
        status === "under_review" ||
        status === "needs_changes"
      );
    case "comment":
      return true;
    default:
      return false;
  }
}

async function ensureClaimForActor(input: {
  submission: ProjectSubmissionRecord;
  actorUserId: string;
  isStaff: boolean;
}): Promise<
  | { ok: true; claimedBy: string; claimExpiresAt: string }
  | { ok: false; reason: "claim_locked" }
> {
  const active = isClaimActive({
    claimedBy: input.submission.claimedBy,
    claimExpiresAt: input.submission.claimExpiresAt,
  });

  if (active && input.submission.claimedBy !== input.actorUserId) {
    if (input.isStaff) {
      return {
        ok: true,
        claimedBy: input.submission.claimedBy!,
        claimExpiresAt: input.submission.claimExpiresAt!,
      };
    }
    return { ok: false, reason: "claim_locked" };
  }

  if (active && input.submission.claimedBy === input.actorUserId) {
    return {
      ok: true,
      claimedBy: input.actorUserId,
      claimExpiresAt: input.submission.claimExpiresAt!,
    };
  }

  const expiresAt = claimExpiresAtIso();
  const db = getDb();
  await db
    .update(projectSubmissions)
    .set({
      claimedBy: input.actorUserId,
      claimExpiresAt: expiresAt,
      status:
        input.submission.status === "submitted"
          ? "under_review"
          : input.submission.status,
      updatedAt: nowIso(),
    })
    .where(eq(projectSubmissions.id, input.submission.id));

  return { ok: true, claimedBy: input.actorUserId, claimExpiresAt: expiresAt };
}

async function upsertVote(input: {
  submissionId: string;
  reviewerId: string;
  reviewRound: number;
  decision: ReviewDecision;
  body: string;
}) {
  const db = getDb();
  const timestamp = nowIso();
  const existing = await db
    .select({ id: submissionReviews.id })
    .from(submissionReviews)
    .where(
      and(
        eq(submissionReviews.submissionId, input.submissionId),
        eq(submissionReviews.reviewerId, input.reviewerId),
        eq(submissionReviews.reviewRound, input.reviewRound),
      ),
    )
    .limit(1);

  if (existing[0]) {
    await db
      .update(submissionReviews)
      .set({
        decision: input.decision,
        body: input.body,
        updatedAt: timestamp,
      })
      .where(eq(submissionReviews.id, existing[0].id));
    return;
  }

  await db.insert(submissionReviews).values({
    submissionId: input.submissionId,
    reviewerId: input.reviewerId,
    reviewRound: input.reviewRound,
    decision: input.decision,
    body: input.body,
  });
}

async function finalizeApproved(submission: ProjectSubmissionRecord) {
  const db = getDb();
  const timestamp = nowIso();
  await db
    .update(projectSubmissions)
    .set({
      status: "approved",
      reviewedAt: timestamp,
      claimedBy: null,
      claimExpiresAt: null,
      updatedAt: timestamp,
    })
    .where(eq(projectSubmissions.id, submission.id));

  const { onProjectApproved } = await import("@/lib/xp/achievements");
  const dbSubmission = await db
    .select({ prUrl: projectSubmissions.prUrl })
    .from(projectSubmissions)
    .where(eq(projectSubmissions.id, submission.id))
    .limit(1);

  await onProjectApproved(submission.userId, submission.id, {
    prUrl: dbSubmission[0]?.prUrl ?? null,
  });

  const { notifyReviewOutcomeAsync } = await import(
    "@/lib/notifications/dispatch"
  );
  notifyReviewOutcomeAsync({
    userId: submission.userId,
    projectSlug: submission.projectSlug,
    projectTitle: submission.projectTitle,
    outcome: "approved",
  });
}

export async function applyReviewAction(input: {
  submissionId: string;
  actorUserId: string;
  actorRole: UserRole;
  action: ReviewAction;
  comment?: string;
}): Promise<ReviewMutationResult> {
  if (!isDatabaseConfigured()) {
    return { ok: false, reason: "database_unconfigured" };
  }

  const submission = await getSubmissionForReview(
    input.submissionId,
    input.actorUserId,
  );

  if (!submission) {
    return { ok: false, reason: "not_found" };
  }

  if (submission.userId === input.actorUserId) {
    return { ok: false, reason: "own_submission" };
  }

  const ctx = await loadPeerReviewContext(input.actorUserId, input.actorRole);

  if (!isEligiblePeer(ctx, submission)) {
    return { ok: false, reason: "not_eligible" };
  }

  const comment = input.comment?.trim() ?? "";

  if (input.action === "comment") {
    if (!comment) {
      return { ok: false, reason: "comment_required" };
    }

    await appendEvent({
      submissionId: submission.id,
      actorUserId: input.actorUserId,
      type: "comment",
      body: comment,
    });

    const refreshed = await getSubmissionForReview(
      submission.id,
      input.actorUserId,
    );
    return refreshed
      ? { ok: true, submission: refreshed }
      : { ok: false, reason: "not_found" };
  }

  if (!canTransition(submission.status, input.action)) {
    return { ok: false, reason: "invalid_transition" };
  }

  if (input.action === "reject" && !ctx.isStaff) {
    return { ok: false, reason: "staff_only" };
  }

  if (
    (input.action === "reject" || input.action === "request_changes") &&
    !comment
  ) {
    return { ok: false, reason: "comment_required" };
  }

  const db = getDb();
  const timestamp = nowIso();

  if (input.action === "start_review") {
    const claim = await ensureClaimForActor({
      submission,
      actorUserId: input.actorUserId,
      isStaff: ctx.isStaff,
    });

    if (!claim.ok) {
      return { ok: false, reason: claim.reason };
    }

    const fromStatus = submission.status;
    const nextStatus: SubmissionStatus =
      fromStatus === "submitted" ? "under_review" : fromStatus;

    await db
      .update(projectSubmissions)
      .set({
        status: nextStatus,
        claimedBy: input.actorUserId,
        claimExpiresAt: claim.claimExpiresAt,
        updatedAt: timestamp,
      })
      .where(eq(projectSubmissions.id, submission.id));

    if (fromStatus !== nextStatus) {
      await appendEvent({
        submissionId: submission.id,
        actorUserId: input.actorUserId,
        type: "status_change",
        fromStatus,
        toStatus: nextStatus,
        body: comment || "Claimed for review.",
      });
    } else {
      await appendEvent({
        submissionId: submission.id,
        actorUserId: input.actorUserId,
        type: "comment",
        body: comment || "Renewed review claim.",
      });
    }

    const refreshed = await getSubmissionForReview(
      submission.id,
      input.actorUserId,
    );
    return refreshed
      ? { ok: true, submission: refreshed }
      : { ok: false, reason: "not_found" };
  }

  const claim = await ensureClaimForActor({
    submission,
    actorUserId: input.actorUserId,
    isStaff: ctx.isStaff,
  });

  if (!claim.ok) {
    return { ok: false, reason: claim.reason };
  }

  if (input.action === "reject") {
    await upsertVote({
      submissionId: submission.id,
      reviewerId: input.actorUserId,
      reviewRound: submission.reviewRound,
      decision: "reject",
      body: comment,
    });

    await db
      .update(projectSubmissions)
      .set({
        status: "rejected",
        reviewedAt: timestamp,
        claimedBy: null,
        claimExpiresAt: null,
        updatedAt: timestamp,
      })
      .where(eq(projectSubmissions.id, submission.id));

    await appendEvent({
      submissionId: submission.id,
      actorUserId: input.actorUserId,
      type: "status_change",
      fromStatus: submission.status,
      toStatus: "rejected",
      body: comment,
    });

    const { notifyReviewOutcomeAsync } = await import(
      "@/lib/notifications/dispatch"
    );
    notifyReviewOutcomeAsync({
      userId: submission.userId,
      projectSlug: submission.projectSlug,
      projectTitle: submission.projectTitle,
      outcome: "rejected",
      comment,
    });

    const refreshed = await getSubmissionForReview(
      submission.id,
      input.actorUserId,
    );
    return refreshed
      ? { ok: true, submission: refreshed }
      : { ok: false, reason: "not_found" };
  }

  if (input.action === "request_changes") {
    await upsertVote({
      submissionId: submission.id,
      reviewerId: input.actorUserId,
      reviewRound: submission.reviewRound,
      decision: "request_changes",
      body: comment,
    });

    await db
      .update(projectSubmissions)
      .set({
        status: "needs_changes",
        claimedBy: null,
        claimExpiresAt: null,
        updatedAt: timestamp,
      })
      .where(eq(projectSubmissions.id, submission.id));

    await appendEvent({
      submissionId: submission.id,
      actorUserId: input.actorUserId,
      type: "status_change",
      fromStatus: submission.status,
      toStatus: "needs_changes",
      body: comment,
    });

    const { notifyReviewOutcomeAsync } = await import(
      "@/lib/notifications/dispatch"
    );
    notifyReviewOutcomeAsync({
      userId: submission.userId,
      projectSlug: submission.projectSlug,
      projectTitle: submission.projectTitle,
      outcome: "changes_requested",
      comment,
    });

    const refreshed = await getSubmissionForReview(
      submission.id,
      input.actorUserId,
    );
    return refreshed
      ? { ok: true, submission: refreshed }
      : { ok: false, reason: "not_found" };
  }

  // approve
  await upsertVote({
    submissionId: submission.id,
    reviewerId: input.actorUserId,
    reviewRound: submission.reviewRound,
    decision: "approve",
    body: comment,
  });

  const approvalCount = await countApprovalsForRound(
    submission.id,
    submission.reviewRound,
  );
  const required = getRequiredApprovals();
  const shouldFinalize = ctx.isStaff || approvalCount >= required;

  if (shouldFinalize) {
    await finalizeApproved(submission);
    await appendEvent({
      submissionId: submission.id,
      actorUserId: input.actorUserId,
      type: "status_change",
      fromStatus: submission.status,
      toStatus: "approved",
      body:
        comment ||
        (ctx.isStaff
          ? "Staff approval."
          : `Reached ${required} peer approvals.`),
    });
  } else {
    await db
      .update(projectSubmissions)
      .set({
        status: "under_review",
        updatedAt: timestamp,
      })
      .where(eq(projectSubmissions.id, submission.id));

    await appendEvent({
      submissionId: submission.id,
      actorUserId: input.actorUserId,
      type: "comment",
      body:
        comment ||
        `Approval recorded (${approvalCount}/${required}).`,
    });
  }

  const refreshed = await getSubmissionForReview(
    submission.id,
    input.actorUserId,
  );
  return refreshed
    ? { ok: true, submission: refreshed }
    : { ok: false, reason: "not_found" };
}
