"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";

import { EmptyState } from "@/components/design-system";
import { useIssuePreferenceIds } from "@/components/issues/issue-actions";
import { IssueRecommendationCard } from "@/components/issues/issue-recommendation-card";
import { Button } from "@/components/ui/button";
import {
  ISSUE_CATEGORIES,
  ISSUE_CATEGORY_LABEL,
  groupRecommendationsByCategory,
  rankIssuesForClient,
} from "@/lib/issues/client";
import { getCuratedIssueById } from "@/lib/issues/engine";
import { undismissIssue } from "@/lib/issues/preferences";
import { cn } from "@/lib/utils";
import type { IssueCategory, IssueRecommendationContext } from "@/types/issues";

type IssueRecommendationsProps = {
  context: IssueRecommendationContext;
};

export function IssueRecommendations({ context }: IssueRecommendationsProps) {
  const [category, setCategory] = useState<IssueCategory | "all">("all");
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [pending, startTransition] = useTransition();
  const { savedIssueIds, dismissedIssueIds } = useIssuePreferenceIds();

  const recommendations = useMemo(() => {
    const ranked = rankIssuesForClient(
      context,
      { savedIssueIds, dismissedIssueIds },
      category,
    );
    if (!showSavedOnly) return ranked;
    return ranked.filter((item) => savedIssueIds.includes(item.issue.id));
  }, [context, savedIssueIds, dismissedIssueIds, category, showSavedOnly]);

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
                  setCategory("all");
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
                    setCategory(item);
                    setShowSavedOnly(false);
                  })
                }
              >
                {ISSUE_CATEGORY_LABEL[item]}
              </FilterChip>
            ))}
          </div>
        </div>

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
                setCategory("all");
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
          Open Contribution Discovery
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
