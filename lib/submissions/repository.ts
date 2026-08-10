import { and, desc, eq, inArray } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { isDatabaseConfigured } from "@/lib/db/env";
import { projectSubmissions, projects, users } from "@/lib/db/schema";
import { notifyReviewQueueAsync } from "@/lib/notifications/dispatch";
import { recordSubmissionEvent } from "@/lib/reviews/repository";
import { ensureProjectRecord } from "@/lib/submissions/ensure-project";
import type {
  ProjectSubmissionRecord,
  SubmissionInput,
  SubmissionStatus,
} from "@/types/submission";
import {
  ACTIVE_SUBMISSION_STATUSES,
  LOCKED_SUBMISSION_STATUSES,
} from "@/types/submission";

function nowIso() {
  return new Date().toISOString();
}

async function notifyQueueForSubmission(input: {
  submissionId: string;
  userId: string;
  projectTitle: string;
}) {
  const db = getDb();
  const [submitter] = await db
    .select({ username: users.username })
    .from(users)
    .where(eq(users.id, input.userId))
    .limit(1);

  notifyReviewQueueAsync({
    submissionId: input.submissionId,
    submitterUserId: input.userId,
    submitterUsername: submitter?.username ?? "builder",
    projectTitle: input.projectTitle,
  });
}

function mapSubmission(
  row: typeof projectSubmissions.$inferSelect,
  project: { slug: string; title: string },
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
  };
}

export async function listUserSubmissionsForProject(
  userId: string,
  projectSlug: string,
): Promise<ProjectSubmissionRecord[]> {
  if (!isDatabaseConfigured()) {
    return [];
  }

  const project = await ensureProjectRecord(projectSlug);

  if (!project) {
    return [];
  }

  const db = getDb();
  const rows = await db
    .select()
    .from(projectSubmissions)
    .where(
      and(
        eq(projectSubmissions.userId, userId),
        eq(projectSubmissions.projectId, project.id),
      ),
    )
    .orderBy(desc(projectSubmissions.updatedAt));

  return rows.map((row) => mapSubmission(row, project));
}

export async function getActiveSubmission(
  userId: string,
  projectSlug: string,
): Promise<ProjectSubmissionRecord | null> {
  const submissions = await listUserSubmissionsForProject(userId, projectSlug);
  return (
    submissions.find((item) => ACTIVE_SUBMISSION_STATUSES.includes(item.status)) ?? null
  );
}

export async function getEditableDraft(
  userId: string,
  projectSlug: string,
): Promise<ProjectSubmissionRecord | null> {
  const active = await getActiveSubmission(userId, projectSlug);
  if (!active) return null;
  if (active.status === "draft" || active.status === "needs_changes") {
    return active;
  }
  return null;
}

export type SaveSubmissionResult =
  | { ok: true; submission: ProjectSubmissionRecord }
  | {
      ok: false;
      reason:
        | "database_unconfigured"
        | "project_not_found"
        | "duplicate_active"
        | "not_found"
        | "not_editable";
    };

function isEditableStatus(status: SubmissionStatus) {
  return status === "draft" || status === "needs_changes";
}

async function writeSubmissionFields(
  userId: string,
  projectSlug: string,
  input: SubmissionInput & { screenshotUrls: string[] },
  nextStatus: SubmissionStatus,
): Promise<SaveSubmissionResult> {
  if (!isDatabaseConfigured()) {
    return { ok: false, reason: "database_unconfigured" };
  }

  const project = await ensureProjectRecord(projectSlug);

  if (!project) {
    return { ok: false, reason: "project_not_found" };
  }

  const db = getDb();
  const timestamp = nowIso();

  const existingActive = await db
    .select()
    .from(projectSubmissions)
    .where(
      and(
        eq(projectSubmissions.userId, userId),
        eq(projectSubmissions.projectId, project.id),
        inArray(projectSubmissions.status, ACTIVE_SUBMISSION_STATUSES),
      ),
    )
    .limit(1);

  const active = existingActive[0];

  if (active && LOCKED_SUBMISSION_STATUSES.includes(active.status)) {
    return { ok: false, reason: "duplicate_active" };
  }

  if (active && isEditableStatus(active.status)) {
    const statusToSet =
      nextStatus === "draft" && active.status === "needs_changes"
        ? "needs_changes"
        : nextStatus;

    const [updated] = await db
      .update(projectSubmissions)
      .set({
        status: statusToSet,
        repoUrl: input.repoUrl,
        prUrl: input.prUrl ?? null,
        liveDemoUrl: input.liveDemoUrl ?? null,
        videoDemoUrl: input.videoDemoUrl ?? null,
        screenshotUrls: input.screenshotUrls,
        notes: input.notes ?? "",
        submittedAt: statusToSet === "submitted" ? timestamp : active.submittedAt,
        reviewRound:
          statusToSet === "submitted" && active.status === "needs_changes"
            ? active.reviewRound + 1
            : active.reviewRound,
        claimedBy: statusToSet === "submitted" ? null : active.claimedBy,
        claimExpiresAt: statusToSet === "submitted" ? null : active.claimExpiresAt,
        updatedAt: timestamp,
      })
      .where(eq(projectSubmissions.id, active.id))
      .returning();

    if (!updated) {
      return { ok: false, reason: "not_found" };
    }

    if (statusToSet !== active.status) {
      await recordSubmissionEvent({
        submissionId: updated.id,
        actorUserId: userId,
        type: "status_change",
        fromStatus: active.status,
        toStatus: statusToSet,
        body: statusToSet === "submitted" ? "Builder submitted for review." : "",
      });
    }

    if (statusToSet === "submitted") {
      const { onProjectSubmitted } = await import("@/lib/xp/achievements");
      await onProjectSubmitted(userId, updated.id);
      await notifyQueueForSubmission({
        submissionId: updated.id,
        userId,
        projectTitle: project.title,
      });
    }

    return { ok: true, submission: mapSubmission(updated, project) };
  }

  const [created] = await db
    .insert(projectSubmissions)
    .values({
      userId,
      projectId: project.id,
      status: nextStatus,
      repoUrl: input.repoUrl,
      prUrl: input.prUrl ?? null,
      liveDemoUrl: input.liveDemoUrl ?? null,
      videoDemoUrl: input.videoDemoUrl ?? null,
      screenshotUrls: input.screenshotUrls,
      notes: input.notes ?? "",
      submittedAt: nextStatus === "submitted" ? timestamp : null,
    })
    .returning();

  if (!created) {
    return { ok: false, reason: "not_found" };
  }

  if (nextStatus === "submitted") {
    await recordSubmissionEvent({
      submissionId: created.id,
      actorUserId: userId,
      type: "status_change",
      fromStatus: null,
      toStatus: "submitted",
      body: "Builder submitted for review.",
    });

    const { onProjectSubmitted } = await import("@/lib/xp/achievements");
    await onProjectSubmitted(userId, created.id);
    await notifyQueueForSubmission({
      submissionId: created.id,
      userId,
      projectTitle: project.title,
    });
  }

  return { ok: true, submission: mapSubmission(created, project) };
}

export async function saveDraftSubmission(
  userId: string,
  projectSlug: string,
  input: SubmissionInput & { screenshotUrls: string[] },
) {
  return writeSubmissionFields(userId, projectSlug, input, "draft");
}

export async function submitProjectSubmission(
  userId: string,
  projectSlug: string,
  input: SubmissionInput & { screenshotUrls: string[] },
) {
  return writeSubmissionFields(userId, projectSlug, input, "submitted");
}

export async function listRecentUserSubmissions(
  userId: string,
  limit = 20,
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
    })
    .from(projectSubmissions)
    .innerJoin(projects, eq(projectSubmissions.projectId, projects.id))
    .where(eq(projectSubmissions.userId, userId))
    .orderBy(desc(projectSubmissions.updatedAt))
    .limit(limit);

  return rows.map((row) =>
    mapSubmission(row.submission, {
      slug: row.projectSlug,
      title: row.projectTitle,
    }),
  );
}

/** Latest submission status per project slug for a user (for project library cards). */
export async function listUserSubmissionStatusByProjectSlug(
  userId: string,
): Promise<Record<string, SubmissionStatus>> {
  if (!isDatabaseConfigured()) {
    return {};
  }

  const db = getDb();
  const rows = await db
    .select({
      slug: projects.slug,
      status: projectSubmissions.status,
      updatedAt: projectSubmissions.updatedAt,
    })
    .from(projectSubmissions)
    .innerJoin(projects, eq(projectSubmissions.projectId, projects.id))
    .where(eq(projectSubmissions.userId, userId))
    .orderBy(desc(projectSubmissions.updatedAt));

  const result: Record<string, SubmissionStatus> = {};
  for (const row of rows) {
    if (!result[row.slug]) {
      result[row.slug] = row.status;
    }
  }

  return result;
}
