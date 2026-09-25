import type { PullRequestContributorRole } from "@/types/portfolio";

const MAX_SKILLS = 24;
const MAX_SKILL_LENGTH = 40;

/** Parse comma / newline separated skills from the edit form. */
export function parseSkillsInput(value: string | undefined | null): string[] {
  if (!value?.trim()) return [];

  const seen = new Set<string>();
  const skills: string[] = [];

  for (const part of value.split(/[\n,]/)) {
    const skill = part.trim().replace(/\s+/g, " ");
    if (!skill) continue;
    const key = skill.toLowerCase();
    if (seen.has(key)) continue;
    if (skill.length > MAX_SKILL_LENGTH) continue;
    seen.add(key);
    skills.push(skill);
    if (skills.length >= MAX_SKILLS) break;
  }

  return skills;
}

export function formatSkillsForInput(skills: string[]): string {
  return skills.join(", ");
}

/**
 * Priority: the builder's own ordered pins (set in settings) > GitHub's own
 * pinned repos > top-starred. `limit` defaults to 4 — the max a builder can
 * pin — so the public profile always has room to show every pin they chose.
 */
export function selectFeaturedRepositories<
  T extends { fullName: string; isPinned: boolean; stargazersCount: number },
>(repos: T[], pinnedRepoFullNames: string[] = [], limit = 4): T[] {
  if (pinnedRepoFullNames.length > 0) {
    const byFullName = new Map(repos.map((repo) => [repo.fullName, repo]));
    const ordered = pinnedRepoFullNames
      .map((fullName) => byFullName.get(fullName))
      .filter((repo): repo is T => Boolean(repo));
    if (ordered.length > 0) {
      return ordered.slice(0, limit);
    }
  }

  const githubPinned = repos.filter((repo) => repo.isPinned);
  if (githubPinned.length > 0) {
    return githubPinned.slice(0, limit);
  }
  return [...repos]
    .sort((a, b) => b.stargazersCount - a.stargazersCount)
    .slice(0, limit);
}

/**
 * Which owned repo (if any) is worth a "Maintainer of X" badge — an owned
 * repo with a real outside signal (forked or starred by people who aren't
 * the builder), not just any personal project. Synced repo metadata only,
 * no extra GitHub calls.
 */
export function selectMaintainerBadge<
  T extends {
    fullName: string;
    name: string;
    forksCount: number;
    stargazersCount: number;
    isFork: boolean;
  },
>(repos: T[], githubLogin: string): { name: string; fullName: string } | null {
  const loginPrefix = `${githubLogin.toLowerCase()}/`;
  const ownedWithOutsideSignal = repos.filter(
    (repo) =>
      !repo.isFork &&
      repo.fullName.toLowerCase().startsWith(loginPrefix) &&
      (repo.forksCount > 0 || repo.stargazersCount >= 3),
  );

  if (ownedWithOutsideSignal.length === 0) return null;

  const [top] = [...ownedWithOutsideSignal].sort(
    (a, b) =>
      b.forksCount + b.stargazersCount - (a.forksCount + a.stargazersCount) ||
      a.name.localeCompare(b.name),
  );

  return { name: top.name, fullName: top.fullName };
}

// Lower rank sorts first — external contributions are the strongest open
// source signal, so they lead the curated highlights list regardless of
// review-comment count.
const ROLE_SORT_RANK: Record<PullRequestContributorRole, number> = {
  external: 0,
  maintainer: 1,
  self: 2,
};

export function selectMergedPrHighlights<
  T extends {
    merged: boolean;
    reviewComments: number;
    mergedAt: string | null;
    title: string;
    role: PullRequestContributorRole;
  },
>(items: T[], limit = 5): T[] {
  const seenTitles = new Set<string>();

  return items
    .filter((item) => item.merged)
    .sort((a, b) => {
      const roleDiff = ROLE_SORT_RANK[a.role] - ROLE_SORT_RANK[b.role];
      if (roleDiff !== 0) return roleDiff;
      if (b.reviewComments !== a.reviewComments) {
        return b.reviewComments - a.reviewComments;
      }
      const aTime = a.mergedAt ? Date.parse(a.mergedAt) : 0;
      const bTime = b.mergedAt ? Date.parse(b.mergedAt) : 0;
      return bTime - aTime;
    })
    // Same branch pushed as a PR title more than once (e.g. "Feat/partners")
    // reads as a glitch in a curated "highlights" list — keep the
    // highest-signal instance only.
    .filter((item) => {
      if (seenTitles.has(item.title)) return false;
      seenTitles.add(item.title);
      return true;
    })
    .slice(0, limit);
}

export function deriveTechnologies(
  languages: Array<string | null | undefined>,
  limit = 12,
): Array<{ name: string; count: number }> {
  const counts = new Map<string, number>();

  for (const language of languages) {
    const name = language?.trim();
    if (!name) continue;
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, limit);
}

/**
 * Event types worth a public visitor's attention. Raw commits (arbitrary,
 * sometimes internal-facing commit messages), "opened PR"/"opened issue"
 * entries (redundant once the same PR has a "merged" entry, and low-signal
 * on their own), are already summarized in the Contribution mix section —
 * showing them again here is noise, not "necessary info."
 */
const PUBLIC_TIMELINE_TYPES = new Set([
  "merged",
  "review",
  "project_submission",
  "roadmap_completion",
  "qa_answer_accepted",
]);

/** Make the timeline safe and relevant for anonymous public viewers. */
export function toPublicTimelineEvents<T extends { href: string | null; type: string }>(
  events: T[],
  limit = 12,
): T[] {
  return events
    .filter((event) => PUBLIC_TIMELINE_TYPES.has(event.type))
    .slice(0, limit)
    .map((event) => {
      if (!event.href) return event;
      if (event.href.startsWith("http")) return event;

      // Owner-only submit / review routes → public project or drop.
      if (event.href.includes("/submit")) {
        return {
          ...event,
          href: event.href.replace(/\/submit\/?$/, ""),
        };
      }
      if (event.href.startsWith("/review/")) {
        return { ...event, href: null };
      }
      if (event.href.startsWith("/activity")) {
        return { ...event, href: null };
      }
      return event;
    });
}
