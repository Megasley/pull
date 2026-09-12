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

export function selectFeaturedRepositories<
  T extends { isPinned: boolean; stargazersCount: number },
>(repos: T[], limit = 6): T[] {
  const pinned = repos.filter((repo) => repo.isPinned);
  if (pinned.length > 0) {
    return pinned.slice(0, limit);
  }
  return [...repos]
    .sort((a, b) => b.stargazersCount - a.stargazersCount)
    .slice(0, limit);
}

export function selectMergedPrHighlights<
  T extends {
    merged: boolean;
    reviewComments: number;
    mergedAt: string | null;
    title: string;
  },
>(items: T[], limit = 6): T[] {
  const seenTitles = new Set<string>();

  return items
    .filter((item) => item.merged)
    .sort((a, b) => {
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
