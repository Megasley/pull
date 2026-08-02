import { and, desc, eq, ilike, inArray, ne, or, sql } from "drizzle-orm";

import {
  BUILDER_DIRECTORY_FILTERS,
  isLookingForId,
  normalizeLookingFor,
  type LookingForId,
} from "@/lib/builders/looking-for";
import { getDb, withDbRetry } from "@/lib/db";
import { isDatabaseConfigured } from "@/lib/db/env";
import { userRoadmapProgress, users } from "@/lib/db/schema";
import { DEMO_PROFILE_USER_ID } from "@/lib/demo/constants";
import { countMergedGithubPullRequestsByUserIds } from "@/lib/github/store";
import { buildAllRoadmapProgressSummaries } from "@/lib/progress/summary";

export const BUILDERS_PAGE_SIZE = 12;
export const BUILDERS_TO_WATCH_LIMIT = 3;
export const ACTIVE_RECENTLY_MS = 7 * 24 * 60 * 60 * 1000;
const DIRECTORY_FETCH_CAP = 400;

export const BUILDER_DIRECTORY_SORTS = ["oss", "prs", "recent"] as const;
export type BuilderDirectorySort = (typeof BUILDER_DIRECTORY_SORTS)[number];

export type BuilderDirectoryFilters = {
  q?: string;
  /** Skill / technology chips (OR within list after AND with query). */
  skills?: string[];
  /** Looking-for interests (OR). */
  lookingFor?: LookingForId[];
  sort?: BuilderDirectorySort;
  page?: number;
  pageSize?: number;
};

export type BuilderDirectoryCard = {
  id: string;
  username: string;
  displayName: string;
  avatar: string | null;
  bio: string;
  githubUsername: string;
  skills: string[];
  lookingFor: LookingForId[];
  builderScore: number;
  ossReputation: number;
  mergedPullRequests: number;
  roadmapStatus: string;
  lastActiveAt: string | null;
  activeRecently: boolean;
};

export type BuilderDirectoryResult = {
  builders: BuilderDirectoryCard[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export function isBuilderDirectorySort(
  value: string | undefined | null,
): value is BuilderDirectorySort {
  return (
    typeof value === "string" &&
    (BUILDER_DIRECTORY_SORTS as readonly string[]).includes(value)
  );
}

export function isActiveRecently(lastActiveAt: string | null | undefined): boolean {
  if (!lastActiveAt) return false;
  const t = Date.parse(lastActiveAt);
  if (Number.isNaN(t)) return false;
  return Date.now() - t < ACTIVE_RECENTLY_MS;
}

function skillsMatchFilter(skills: string[], filters: string[]): boolean {
  if (filters.length === 0) return true;
  const normalized = skills.map((skill) => skill.toLowerCase());
  return filters.some((filter) =>
    normalized.some(
      (skill) =>
        skill === filter.toLowerCase() ||
        skill.includes(filter.toLowerCase()),
    ),
  );
}

function lookingForMatchFilter(
  lookingFor: LookingForId[],
  filters: LookingForId[],
): boolean {
  if (filters.length === 0) return true;
  return filters.some((id) => lookingFor.includes(id));
}

function formatRoadmapStatus(
  progressByRoadmap: Record<string, string[]>,
): string {
  const summaries = buildAllRoadmapProgressSummaries(progressByRoadmap).filter(
    (item) => item.completed > 0,
  );
  if (summaries.length === 0) return "Not started";

  const completed = summaries.filter(
    (item) => item.total > 0 && item.completed === item.total,
  );
  if (completed.length > 0) {
    return completed.length === 1
      ? `${completed[0].title} complete`
      : `${completed.length} roadmaps complete`;
  }

  const primary = [...summaries].sort(
    (a, b) => b.percentage - a.percentage,
  )[0];
  return `${primary.title} · ${primary.percentage}%`;
}

function emptyResult(
  page: number,
  pageSize: number,
): BuilderDirectoryResult {
  return { builders: [], total: 0, page, pageSize, totalPages: 0 };
}

function queryErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) return String(error);
  const cause =
    error.cause instanceof Error
      ? error.cause.message
      : typeof error.cause === "string"
        ? error.cause
        : "";
  return cause ? `${error.message} | cause: ${cause}` : error.message;
}

function sortBuilders(
  builders: BuilderDirectoryCard[],
  sort: BuilderDirectorySort,
): BuilderDirectoryCard[] {
  const copy = [...builders];
  copy.sort((a, b) => {
    if (sort === "prs") {
      if (b.mergedPullRequests !== a.mergedPullRequests) {
        return b.mergedPullRequests - a.mergedPullRequests;
      }
      return b.ossReputation - a.ossReputation;
    }
    if (sort === "recent") {
      const aTime = a.lastActiveAt ? Date.parse(a.lastActiveAt) : 0;
      const bTime = b.lastActiveAt ? Date.parse(b.lastActiveAt) : 0;
      if (bTime !== aTime) return bTime - aTime;
      return b.ossReputation - a.ossReputation;
    }
    if (b.ossReputation !== a.ossReputation) {
      return b.ossReputation - a.ossReputation;
    }
    return b.mergedPullRequests - a.mergedPullRequests;
  });
  return copy;
}

/**
 * Directory listing reads persisted score snapshots (refreshed on profile view
 * and GitHub sync). Merged PR counts come from synced GitHub data.
 */
export async function listBuildersForDirectory(
  filters: BuilderDirectoryFilters = {},
): Promise<BuilderDirectoryResult> {
  const pageSize = Math.min(
    Math.max(filters.pageSize ?? BUILDERS_PAGE_SIZE, 1),
    48,
  );
  const page = Math.max(filters.page ?? 1, 1);

  if (!isDatabaseConfigured()) {
    return emptyResult(page, pageSize);
  }

  try {
    return await withDbRetry(() =>
      listBuildersForDirectoryInner({
        ...filters,
        page,
        pageSize,
      }),
    );
  } catch (error) {
    console.error("[builders] directory query failed", queryErrorMessage(error));
    return emptyResult(page, pageSize);
  }
}

async function listBuildersForDirectoryInner(
  filters: BuilderDirectoryFilters & { page: number; pageSize: number },
): Promise<BuilderDirectoryResult> {
  const { page, pageSize } = filters;
  const db = getDb();
  const q = filters.q?.trim() ?? "";
  const sort: BuilderDirectorySort = isBuilderDirectorySort(filters.sort)
    ? filters.sort
    : "oss";
  const skillFilters = (filters.skills ?? []).filter((skill) =>
    BUILDER_DIRECTORY_FILTERS.some(
      (option) => option.toLowerCase() === skill.toLowerCase(),
    ),
  );
  const lookingFilters = (filters.lookingFor ?? []).filter(
    (id): id is LookingForId =>
      isLookingForId(id) && id !== "not_actively_looking",
  );

  const conditions = [
    eq(users.accountStatus, "active"),
    eq(users.profilePublic, true),
    eq(users.listedInDirectory, true),
    ne(users.id, DEMO_PROFILE_USER_ID),
  ];

  if (q) {
    const pattern = `%${q}%`;
    conditions.push(
      or(
        ilike(users.displayName, pattern),
        ilike(users.username, pattern),
        ilike(users.githubUsername, pattern),
        ilike(users.bio, pattern),
        sql`exists (
          select 1
          from jsonb_array_elements_text(coalesce(${users.skills}, '[]'::jsonb)) as skill
          where skill ilike ${pattern}
        )`,
      )!,
    );
  }

  if (lookingFilters.length > 0) {
    conditions.push(
      sql`exists (
        select 1
        from jsonb_array_elements_text(coalesce(${users.lookingFor}, '[]'::jsonb)) as lf
        where lf in (${sql.join(
          lookingFilters.map((id) => sql`${id}`),
          sql`, `,
        )})
      )`,
    );
  }

  const whereClause = and(...conditions);

  const rows = await db
    .select({
      id: users.id,
      username: users.username,
      displayName: users.displayName,
      avatar: users.avatar,
      bio: users.bio,
      githubUsername: users.githubUsername,
      skills: users.skills,
      lookingFor: users.lookingFor,
      builderScore: users.builderScore,
      ossReputation: users.ossReputation,
      lastActiveAt: users.lastActiveAt,
    })
    .from(users)
    .where(whereClause)
    .orderBy(desc(users.ossReputation), desc(users.lastActiveAt))
    .limit(DIRECTORY_FETCH_CAP);

  const mapped = rows
    .map((row) => {
      const lookingFor = normalizeLookingFor(row.lookingFor);
      return {
        id: row.id,
        username: row.username,
        displayName: row.displayName,
        avatar: row.avatar,
        bio: (row.bio ?? "").trim(),
        githubUsername: row.githubUsername,
        skills: Array.isArray(row.skills) ? row.skills : [],
        lookingFor,
        builderScore: row.builderScore ?? 0,
        ossReputation: row.ossReputation ?? 0,
        mergedPullRequests: 0,
        roadmapStatus: "Not started",
        lastActiveAt: row.lastActiveAt,
        activeRecently: isActiveRecently(row.lastActiveAt),
      } satisfies BuilderDirectoryCard;
    })
    .filter(
      (row) =>
        skillsMatchFilter(row.skills, skillFilters) &&
        lookingForMatchFilter(row.lookingFor, lookingFilters),
    );

  const mergedCounts = await countMergedGithubPullRequestsByUserIds(
    mapped.map((row) => row.id),
  );
  const withCounts = mapped.map((row) => ({
    ...row,
    mergedPullRequests: mergedCounts.get(row.id) ?? 0,
  }));

  const sorted = sortBuilders(withCounts, sort);
  const resolvedTotal = sorted.length;
  const totalPages =
    resolvedTotal === 0 ? 0 : Math.max(1, Math.ceil(resolvedTotal / pageSize));
  const safePage = totalPages === 0 ? 1 : Math.min(page, totalPages);
  const pageRows = sorted.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize,
  );

  if (pageRows.length === 0) {
    return {
      builders: [],
      total: resolvedTotal,
      page: safePage,
      pageSize,
      totalPages,
    };
  }

  const ids = pageRows.map((row) => row.id);
  const progressRows = await db
    .select({
      userId: userRoadmapProgress.userId,
      roadmapSlug: userRoadmapProgress.roadmapSlug,
      nodeSlug: userRoadmapProgress.nodeSlug,
    })
    .from(userRoadmapProgress)
    .where(
      and(
        inArray(userRoadmapProgress.userId, ids),
        eq(userRoadmapProgress.status, "completed"),
      ),
    );

  const progressByUser = new Map<string, Record<string, string[]>>();
  for (const row of progressRows) {
    const current = progressByUser.get(row.userId) ?? {};
    const nodes = current[row.roadmapSlug] ?? [];
    nodes.push(row.nodeSlug);
    current[row.roadmapSlug] = nodes;
    progressByUser.set(row.userId, current);
  }

  return {
    builders: pageRows.map((row) => ({
      ...row,
      roadmapStatus: formatRoadmapStatus(progressByUser.get(row.id) ?? {}),
    })),
    total: resolvedTotal,
    page: safePage,
    pageSize,
    totalPages,
  };
}

/** Curated strip: recently active builders with strong OSS reputation. */
export async function listBuildersToWatch(
  limit = BUILDERS_TO_WATCH_LIMIT,
): Promise<BuilderDirectoryCard[]> {
  const result = await listBuildersForDirectory({
    page: 1,
    pageSize: Math.min(48, Math.max(limit * 8, 24)),
    sort: "oss",
  });

  const ranked = [...result.builders].sort((a, b) => {
    const aActive = a.activeRecently ? 1 : 0;
    const bActive = b.activeRecently ? 1 : 0;
    if (bActive !== aActive) return bActive - aActive;
    if (b.ossReputation !== a.ossReputation) {
      return b.ossReputation - a.ossReputation;
    }
    return b.mergedPullRequests - a.mergedPullRequests;
  });

  return ranked.slice(0, limit);
}

export async function listFeaturedBuilders(
  limit = 6,
): Promise<BuilderDirectoryCard[]> {
  return listBuildersToWatch(limit);
}

/** @deprecated kept for type imports; prefer BuilderDirectoryFilters.lookingFor */
export type BuilderDirectoryFutureFilters = {
  minOssReputation?: number;
  minMergedPrs?: number;
  lookingFor?: LookingForId[];
};
