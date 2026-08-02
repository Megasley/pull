"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { EmptyState } from "@/components/design-system";
import { useIssuePreferenceIds } from "@/components/issues/issue-actions";
import { IssueRecommendationCard } from "@/components/issues/issue-recommendation-card";
import { Button } from "@/components/ui/button";
import {
  ISSUE_CATEGORIES,
  ISSUE_CATEGORY_LABEL,
  getCuratedIssueSkills,
  groupRecommendationsByCategory,
  rankIssuesForClient,
} from "@/lib/issues/client";
import { getCuratedIssueById } from "@/lib/issues/engine";
import { undismissIssue } from "@/lib/issues/preferences";
import { cn } from "@/lib/utils";
import type { RoadmapDifficulty } from "@/types";
import type { IssueCategory, IssueRecommendationContext } from "@/types/issues";

const DIFFICULTY_OPTIONS: Array<RoadmapDifficulty | "all"> = [
  "all",
  "beginner",
  "intermediate",
  "advanced",
];

const difficultyLabels: Record<RoadmapDifficulty | "all", string> = {
  all: "All levels",
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

type IssueRecommendationsProps = {
  context: IssueRecommendationContext;
};

export function IssueRecommendations({ context }: IssueRecommendationsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [pending, startTransition] = useTransition();
  const { savedIssueIds, dismissedIssueIds } = useIssuePreferenceIds();

  const category = (searchParams.get("category") as IssueCategory | "all" | null) ?? "all";
  const difficulty =
    (searchParams.get("difficulty") as RoadmapDifficulty | "all" | null) ?? "all";
  const skill = searchParams.get("skill") ?? "all";
  const skills = useMemo(() => getCuratedIssueSkills(), []);

  function updateFilters(next: {
    category?: IssueCategory | "all";
    difficulty?: RoadmapDifficulty | "all";
    skill?: string | "all";
  }) {
    const params = new URLSearchParams(searchParams.toString());
    const values = {
      category: next.category ?? category,
      difficulty: next.difficulty ?? difficulty,
      skill: next.skill ?? skill,
    };

    for (const [key, value] of Object.entries(values)) {
      if (!value || value === "all") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  const recommendations = useMemo(() => {
    const ranked = rankIssuesForClient(
      context,
      { savedIssueIds, dismissedIssueIds },
      { category, difficulty, skill },
    );
    if (!showSavedOnly) return ranked;
    return ranked.filter((item) => savedIssueIds.includes(item.issue.id));
  }, [
    context,
    savedIssueIds,
    dismissedIssueIds,
    category,
    difficulty,
    skill,
    showSavedOnly,
  ]);

  const groups = useMemo(
    () => groupRecommendationsByCategory(recommendations),
    [recommendations],
  );

  return (
    <div className="space-y-8">
      <div className="space-y-4 rounded-none border border-border bg-card p-4 sm:p-5">
        <div className="space-y-2">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Category
          </p>
          <div className="-mx-1 flex flex-nowrap gap-2 overflow-x-auto overscroll-x-contain px-1 pb-1 [scrollbar-width:thin]">
            <FilterChip
              active={category === "all"}
              onClick={() =>
                startTransition(() => {
                  updateFilters({ category: "all" });
                  setShowSavedOnly(false);
                })
              }
            >
              All
            </FilterChip>
            {ISSUE_CATEGORIES.map((item) => (
              <FilterChip
                key={item}
                active={category === item}
                onClick={() =>
                  startTransition(() => {
                    updateFilters({ category: item });
                    setShowSavedOnly(false);
                  })
                }
              >
                {ISSUE_CATEGORY_LABEL[item]}
              </FilterChip>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Difficulty
          </p>
          <div className="-mx-1 flex flex-nowrap gap-2 overflow-x-auto overscroll-x-contain px-1 pb-1 [scrollbar-width:thin]">
            {DIFFICULTY_OPTIONS.map((item) => (
              <FilterChip
                key={item}
                active={difficulty === item}
                onClick={() =>
                  startTransition(() => {
                    updateFilters({ difficulty: item });
                    setShowSavedOnly(false);
                  })
                }
              >
                {difficultyLabels[item]}
              </FilterChip>
            ))}
          </div>
        </div>

        {skills.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Skill
            </p>
            <div className="-mx-1 flex flex-nowrap gap-2 overflow-x-auto overscroll-x-contain px-1 pb-1 [scrollbar-width:thin]">
              <FilterChip
                active={skill === "all"}
                onClick={() =>
                  startTransition(() => {
                    updateFilters({ skill: "all" });
                    setShowSavedOnly(false);
                  })
                }
              >
                All skills
              </FilterChip>
              {skills.map((item) => (
                <FilterChip
                  key={item}
                  active={skill === item}
                  onClick={() =>
                    startTransition(() => {
                      updateFilters({ skill: item });
                      setShowSavedOnly(false);
                    })
                  }
                >
                  {item}
                </FilterChip>
              ))}
            </div>
          </div>
        ) : null}

        <div className="-mx-1 flex flex-nowrap gap-2 overflow-x-auto overscroll-x-contain px-1 pb-1 [scrollbar-width:thin]">
          <FilterChip
            active={!showSavedOnly}
            onClick={() =>
              startTransition(() => {
                setShowSavedOnly(false);
              })
            }
          >
            Recommended
          </FilterChip>
          <FilterChip
            active={showSavedOnly}
            onClick={() =>
              startTransition(() => {
                setShowSavedOnly(true);
                updateFilters({ category: "all", difficulty: "all", skill: "all" });
              })
            }
          >
            Saved ({savedIssueIds.length})
          </FilterChip>
        </div>

        <p className="text-xs text-muted-foreground">
          {recommendations.length} issue
          {recommendations.length === 1 ? "" : "s"}
          {dismissedIssueIds.length > 0
            ? ` · ${dismissedIssueIds.length} dismissed`
            : ""}
        </p>
      </div>

      <div
        className={cn(
          "space-y-10 transition-opacity duration-200",
          pending ? "opacity-60" : "opacity-100",
        )}
      >
        {recommendations.length === 0 ? (
          <EmptyState
            title={showSavedOnly ? "No saved issues yet" : "No matching issues"}
            description={
              showSavedOnly
                ? "Save recommendations to build a personal issue queue."
                : dismissedIssueIds.length > 0
                  ? "Try another category, or restore a dismissed issue below."
                  : "Sync GitHub and complete roadmaps to sharpen matches."
            }
            actionLabel={showSavedOnly ? "Back to recommendations" : undefined}
            onAction={
              showSavedOnly
                ? () =>
                    startTransition(() => {
                      setShowSavedOnly(false);
                    })
                : undefined
            }
          />
        ) : category === "all" && !showSavedOnly ? (
          groups.map((group) => (
            <section key={group.category} className="space-y-4">
              <div className="flex items-end justify-between gap-3">
                <h2 className="text-lg font-semibold tracking-tight">
                  {group.label}
                </h2>
                <span className="text-xs text-muted-foreground">
                  {group.items.length}
                </span>
              </div>
              <ul className="grid gap-4 md:grid-cols-2">
                {group.items.map((item, index) => (
                  <li key={item.issue.id}>
                    <IssueRecommendationCard
                      recommendation={item}
                      index={index}
                    />
                  </li>
                ))}
              </ul>
            </section>
          ))
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {recommendations.map((item, index) => (
              <li key={item.issue.id}>
                <IssueRecommendationCard recommendation={item} index={index} />
              </li>
            ))}
          </ul>
        )}
      </div>

      {dismissedIssueIds.length > 0 && !showSavedOnly ? (
        <section className="rounded-none border border-dashed border-border bg-transparent p-4">
          <h2 className="text-sm font-medium">Dismissed</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Restore an issue to bring it back into recommendations.
          </p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {dismissedIssueIds.map((id) => {
              const issue = getCuratedIssueById(id);
              return (
                <li key={id}>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => undismissIssue(id)}
                  >
                    Restore {issue ? `#${issue.number}` : id}
                  </Button>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <p className="text-center text-sm text-muted-foreground">
        Looking for repositories first?{" "}
        <Link href="/discover" className="underline underline-offset-4">
          Open Source Projects
        </Link>
      </p>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-none border px-2.5 py-1.5 text-xs transition-colors",
        active
          ? "border-foreground/30 bg-foreground text-background"
          : "border-border bg-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
