import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import { getDb } from "@/lib/db";
import { isDatabaseConfigured } from "@/lib/db/env";
import { submittedIssues, users } from "@/lib/db/schema";
import { getAllDiscoveryRepositories } from "@/lib/discovery/catalog";
import { GithubClient } from "@/lib/github/client";
import { getGithubConnection } from "@/lib/github/store";
import type { RoadmapDifficulty } from "@/types";
import type { DiscoveryTrack } from "@/types/discovery";
import type { CuratedIssue, IssueCategory } from "@/types/issues";

import { fetchIssueState } from "./availability";
import {
  classifyIssueFromLabels,
  parseIssueUrl,
  summarizeIssueBody,
  type IssueClassification,
} from "./classify";
import { getAllCuratedIssues, ISSUE_CATEGORIES } from "./engine";

const RATE_LIMIT_WINDOW_MINUTES = 60;
const RATE_LIMIT_MAX_SUBMISSIONS = 5;

/** Prefix for submitted issues' ids in recommendations, so they can never
 *  collide with the static catalog's slug ids (saved/dismissed prefs are
 *  keyed by id). */
const SUBMITTED_ISSUE_ID_PREFIX = "sub-";

type GithubIssueResponse = {
  number: number;
  title: string;
  html_url: string;
  state: string;
  body: string | null;
  pull_request?: unknown;
  labels: Array<string | { name?: string }>;
};

type GithubRepoResponse = {
  full_name: string;
  language: string | null;
  private: boolean;
};

export type IssueSubmissionPreview = {
  issueUrl: string;
  repoFullName: string;
  number: number;
  title: string;
  labels: string[];
  language: string | null;
  summary: string;
  tracks: DiscoveryTrack[];
} & IssueClassification;

export type IssueSubmissionError =
  | "invalid_url"
  | "not_found"
  | "is_pull_request"
  | "issue_closed"
  | "already_listed"
  | "already_submitted"
  | "rate_limited"
  | "check_failed";

function catalogRepoFor(repoFullName: string) {
  const lower = repoFullName.toLowerCase();
  return (
    getAllDiscoveryRepositories().find((repo) => repo.repository.toLowerCase() === lower) ??
    null
  );
}

/** The builder's own token when they have one (better rate limits), else
 *  the shared discovery token, else unauthenticated — public issues need
 *  no auth. A stale/revoked personal token falls through to the next one
 *  rather than failing the submission. */
async function clientsFor(userId: string): Promise<GithubClient[]> {
  const connection = await getGithubConnection(userId);
  const tokens = [connection?.accessToken, process.env.GITHUB_DISCOVERY_TOKEN, ""].filter(
    (token): token is string => typeof token === "string",
  );
  return [...new Set(tokens)].map((token) => new GithubClient(token));
}

async function fetchIssueAndRepo(
  clients: GithubClient[],
  owner: string,
  repo: string,
  number: number,
): Promise<[GithubIssueResponse, GithubRepoResponse]> {
  let lastError: unknown;
  for (const client of clients) {
    try {
      return await Promise.all([
        client.request<GithubIssueResponse>(`/repos/${owner}/${repo}/issues/${number}`),
        client.request<GithubRepoResponse>(`/repos/${owner}/${repo}`),
      ]);
    } catch (error) {
      lastError = error;
      if ((error as { status?: number }).status !== 401) {
        throw error;
      }
    }
  }
  throw lastError;
}

/** Pulls the issue's real data from GitHub and pre-classifies it from its
 *  labels. Shared by the submit form's preview and the actual submit, so
 *  what's stored is always what GitHub says, never what was typed. */
async function loadIssueFromGithub(
  issueUrl: string,
  userId: string,
): Promise<{ ok: true; preview: IssueSubmissionPreview } | { ok: false; reason: IssueSubmissionError }> {
  const parsed = parseIssueUrl(issueUrl);
  if (!parsed) {
    return { ok: false, reason: "invalid_url" };
  }

  const catalogRepo = catalogRepoFor(parsed.repoFullName);
  const alreadyCurated = getAllCuratedIssues().some(
    (issue) =>
      issue.number === parsed.number &&
      catalogRepo !== null &&
      issue.repoId === catalogRepo.id,
  );
  if (alreadyCurated) {
    return { ok: false, reason: "already_listed" };
  }

  let issue: GithubIssueResponse;
  let repo: GithubRepoResponse;
  try {
    [issue, repo] = await fetchIssueAndRepo(
      await clientsFor(userId),
      parsed.owner,
      parsed.repo,
      parsed.number,
    );
  } catch (error) {
    const status = (error as { status?: number }).status;
    if (status === 404 || status === 410) {
      return { ok: false, reason: "not_found" };
    }
    console.error("[issues] loadIssueFromGithub failed", error);
    return { ok: false, reason: "check_failed" };
  }

  if (repo.private) {
    return { ok: false, reason: "not_found" };
  }
  if (issue.pull_request) {
    return { ok: false, reason: "is_pull_request" };
  }
  if (issue.state !== "open") {
    return { ok: false, reason: "issue_closed" };
  }

  const labels = issue.labels
    .map((label) => (typeof label === "string" ? label : (label.name ?? "")))
    .filter(Boolean);
  const language = repo.language ?? catalogRepo?.language ?? null;

  return {
    ok: true,
    preview: {
      issueUrl: issue.html_url,
      // GitHub's canonical casing, so the unique (repo, number) index can't
      // be dodged by pasting "Owner/Repo" vs "owner/repo".
      repoFullName: repo.full_name,
      number: issue.number,
      title: issue.title,
      labels,
      language,
      summary: summarizeIssueBody(issue.body, issue.title),
      tracks: catalogRepo?.tracks ?? [],
      ...classifyIssueFromLabels(labels, language),
    },
  };
}

async function findExistingSubmission(repoFullName: string, number: number) {
  const db = getDb();
  const [row] = await db
    .select({ id: submittedIssues.id, status: submittedIssues.status })
    .from(submittedIssues)
    .where(
      and(
        sql`lower(${submittedIssues.repoFullName}) = lower(${repoFullName})`,
        eq(submittedIssues.number, number),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function previewIssueSubmission(input: {
  issueUrl: string;
  userId: string;
}): Promise<
  | { ok: true; preview: IssueSubmissionPreview }
  | { ok: false; reason: IssueSubmissionError }
> {
  const result = await loadIssueFromGithub(input.issueUrl, input.userId);
  if (!result.ok || !isDatabaseConfigured()) {
    return result;
  }
  const existing = await findExistingSubmission(
    result.preview.repoFullName,
    result.preview.number,
  );
  if (existing) {
    return { ok: false, reason: "already_submitted" };
  }
  return result;
}

async function isRateLimited(userId: string): Promise<boolean> {
  const db = getDb();
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(submittedIssues)
    .where(
      and(
        eq(submittedIssues.submittedByUserId, userId),
        sql`${submittedIssues.createdAt} > now() - (${RATE_LIMIT_WINDOW_MINUTES} || ' minutes')::interval`,
      ),
    );
  return (row?.count ?? 0) >= RATE_LIMIT_MAX_SUBMISSIONS;
}

export async function createIssueSubmission(input: {
  issueUrl: string;
  userId: string;
}): Promise<
  | { ok: true; id: string; preview: IssueSubmissionPreview }
  | { ok: false; reason: IssueSubmissionError }
> {
  if (!isDatabaseConfigured()) {
    return { ok: false, reason: "check_failed" };
  }
  if (await isRateLimited(input.userId)) {
    return { ok: false, reason: "rate_limited" };
  }

  const result = await previewIssueSubmission(input);
  if (!result.ok) {
    return result;
  }
  const { preview } = result;

  const db = getDb();
  const [row] = await db
    .insert(submittedIssues)
    .values({
      issueUrl: preview.issueUrl,
      repoFullName: preview.repoFullName,
      number: preview.number,
      title: preview.title,
      labels: preview.labels,
      language: preview.language,
      category: preview.category,
      difficulty: preview.difficulty,
      skills: preview.skills,
      tracks: preview.tracks,
      estimatedHours: preview.estimatedHours,
      summary: preview.summary,
      submittedByUserId: input.userId,
    })
    .onConflictDoNothing()
    .returning({ id: submittedIssues.id });

  if (!row) {
    return { ok: false, reason: "already_submitted" };
  }
  return { ok: true, id: row.id, preview };
}

export type SubmittedIssueRecord = {
  id: string;
  issueUrl: string;
  repoFullName: string;
  number: number;
  title: string;
  labels: string[];
  language: string | null;
  category: IssueCategory;
  difficulty: RoadmapDifficulty;
  skills: string[];
  tracks: DiscoveryTrack[];
  estimatedHours: number;
  summary: string;
  status: (typeof submittedIssues.$inferSelect)["status"];
  rejectionReason: string | null;
  submittedByUsername: string | null;
  moderatedByUsername: string | null;
  moderatedAt: string | null;
  createdAt: string;
};

async function selectSubmissions(where?: ReturnType<typeof eq>) {
  const db = getDb();
  const submitter = alias(users, "submitter");
  const moderator = alias(users, "moderator");
  const query = db
    .select({
      row: submittedIssues,
      submittedByUsername: submitter.username,
      moderatedByUsername: moderator.username,
    })
    .from(submittedIssues)
    .leftJoin(submitter, eq(submittedIssues.submittedByUserId, submitter.id))
    .leftJoin(moderator, eq(submittedIssues.moderatedByUserId, moderator.id));

  const rows = await (where ? query.where(where) : query).orderBy(
    sql`case when ${submittedIssues.status} = 'pending' then 0 else 1 end`,
    desc(submittedIssues.createdAt),
  );

  return rows.map(
    ({ row, submittedByUsername, moderatedByUsername }): SubmittedIssueRecord => ({
      id: row.id,
      issueUrl: row.issueUrl,
      repoFullName: row.repoFullName,
      number: row.number,
      title: row.title,
      labels: row.labels,
      language: row.language,
      category: row.category,
      difficulty: row.difficulty,
      skills: row.skills,
      tracks: row.tracks,
      estimatedHours: row.estimatedHours,
      summary: row.summary,
      status: row.status,
      rejectionReason: row.rejectionReason,
      submittedByUsername,
      moderatedByUsername,
      moderatedAt: row.moderatedAt,
      createdAt: row.createdAt,
    }),
  );
}

/** Admin moderation view: everything, pending first. */
export async function listAllIssueSubmissions(): Promise<SubmittedIssueRecord[]> {
  if (!isDatabaseConfigured()) {
    return [];
  }
  return selectSubmissions();
}

export async function listMyIssueSubmissions(userId: string): Promise<SubmittedIssueRecord[]> {
  if (!isDatabaseConfigured()) {
    return [];
  }
  return selectSubmissions(eq(submittedIssues.submittedByUserId, userId));
}

export type ApproveIssueInput = {
  id: string;
  moderatorUserId: string;
  category: IssueCategory;
  difficulty: RoadmapDifficulty;
  skills: string[];
  tracks: DiscoveryTrack[];
  estimatedHours: number;
  summary: string;
};

const DIFFICULTIES: RoadmapDifficulty[] = ["beginner", "intermediate", "advanced"];
const TRACKS: DiscoveryTrack[] = ["bitcoin", "lightning"];

export async function approveIssueSubmission(
  input: ApproveIssueInput,
): Promise<{ ok: true } | { ok: false; reason: "not_found" | "invalid" }> {
  if (
    !ISSUE_CATEGORIES.includes(input.category) ||
    !DIFFICULTIES.includes(input.difficulty) ||
    !input.tracks.every((track) => TRACKS.includes(track)) ||
    !Number.isInteger(input.estimatedHours) ||
    input.estimatedHours < 1 ||
    input.estimatedHours > 200 ||
    input.summary.trim().length === 0
  ) {
    return { ok: false, reason: "invalid" };
  }

  const skills = [
    ...new Set(input.skills.map((skill) => skill.trim().toLowerCase()).filter(Boolean)),
  ].slice(0, 8);

  const db = getDb();
  const now = new Date().toISOString();
  const updated = await db
    .update(submittedIssues)
    .set({
      status: "approved",
      category: input.category,
      difficulty: input.difficulty,
      skills,
      tracks: input.tracks,
      estimatedHours: input.estimatedHours,
      summary: input.summary.trim().slice(0, 400),
      rejectionReason: null,
      moderatedByUserId: input.moderatorUserId,
      moderatedAt: now,
      updatedAt: now,
    })
    .where(
      and(
        eq(submittedIssues.id, input.id),
        inArray(submittedIssues.status, ["pending", "rejected"]),
      ),
    )
    .returning({ id: submittedIssues.id });

  return updated.length > 0 ? { ok: true } : { ok: false, reason: "not_found" };
}

export async function rejectIssueSubmission(input: {
  id: string;
  moderatorUserId: string;
  reason: string;
}): Promise<{ ok: true } | { ok: false; reason: "not_found" }> {
  const db = getDb();
  const now = new Date().toISOString();
  const updated = await db
    .update(submittedIssues)
    .set({
      status: "rejected",
      rejectionReason: input.reason.trim().slice(0, 400) || null,
      moderatedByUserId: input.moderatorUserId,
      moderatedAt: now,
      updatedAt: now,
    })
    .where(
      and(
        eq(submittedIssues.id, input.id),
        inArray(submittedIssues.status, ["pending", "approved"]),
      ),
    )
    .returning({ id: submittedIssues.id });

  return updated.length > 0 ? { ok: true } : { ok: false, reason: "not_found" };
}

/**
 * Approved submissions shaped like catalog issues, for the recommendation
 * engine. Each one's GitHub state is re-checked (cached — see
 * lib/issues/availability.ts); any that closed, were deleted, or got
 * converted are marked `closed` here so they drop out for good. Fails open
 * on GitHub errors, same as the catalog check.
 */
export async function loadApprovedSubmittedIssues(): Promise<CuratedIssue[]> {
  if (!isDatabaseConfigured()) {
    return [];
  }

  const db = getDb();
  const submitter = alias(users, "submitter");
  const rows = await db
    .select({ row: submittedIssues, submittedByUsername: submitter.username })
    .from(submittedIssues)
    .leftJoin(submitter, eq(submittedIssues.submittedByUserId, submitter.id))
    .where(eq(submittedIssues.status, "approved"));

  const states = await Promise.all(
    rows.map(({ row }) => fetchIssueState(row.repoFullName, row.number)),
  );

  const closedIds = rows
    .filter((_, index) => states[index] !== "open" && states[index] !== "unknown")
    .map(({ row }) => row.id);
  if (closedIds.length > 0) {
    await db
      .update(submittedIssues)
      .set({ status: "closed", updatedAt: new Date().toISOString() })
      .where(inArray(submittedIssues.id, closedIds));
  }

  const closed = new Set(closedIds);
  return rows
    .filter(({ row }) => !closed.has(row.id))
    .map(({ row, submittedByUsername }): CuratedIssue => {
      const catalogRepo = catalogRepoFor(row.repoFullName);
      return {
        id: `${SUBMITTED_ISSUE_ID_PREFIX}${row.id}`,
        repoId: catalogRepo?.id ?? `github:${row.repoFullName.toLowerCase()}`,
        repositoryFullName: row.repoFullName,
        number: row.number,
        title: row.title,
        // Same shape as the catalog: the card links to `${url}/${number}`.
        url: `https://github.com/${row.repoFullName}/issues`,
        category: row.category,
        labels: row.labels,
        difficulty: row.difficulty,
        language: row.language ?? "Other",
        tracks: row.tracks,
        skills: row.skills,
        estimatedHours: row.estimatedHours,
        summary: row.summary,
        submittedByUsername,
      };
    });
}
