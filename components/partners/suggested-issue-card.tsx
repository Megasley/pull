import { Badge } from "@/components/ui/badge";
import { ISSUE_CATEGORY_SINGULAR } from "@/lib/issues/engine";
import type { CuratedIssue } from "@/types/issues";

type SuggestedIssueCardProps = {
  issue: CuratedIssue;
  index?: number;
};

/**
 * Compact issue suggestion for the partner hub — deliberately lighter than
 * IssueRecommendationCard (no save/dismiss; this isn't the personalized
 * /issues feed, just a default set of real issues relevant to a skill set).
 */
export function SuggestedIssueCard({ issue, index = 0 }: SuggestedIssueCardProps) {
  return (
    <div
      className="animate-fade-in-up flex h-full flex-col border border-border bg-card p-5"
      style={{ animationDelay: `${Math.min(index, 12) * 50}ms` }}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary">{ISSUE_CATEGORY_SINGULAR[issue.category]}</Badge>
        <Badge variant="outline">{issue.difficulty}</Badge>
        <Badge variant="outline">{issue.language}</Badge>
      </div>

      <h3 className="mt-3 text-base font-semibold tracking-tight break-words">
        {issue.title}
      </h3>

      <p className="mt-2 flex-1 text-sm text-muted-foreground">{issue.summary}</p>

      {issue.skills.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {issue.skills.slice(0, 4).map((skill) => (
            <span
              key={skill}
              className="border border-border bg-muted/30 px-2 py-0.5 text-[11px] text-muted-foreground"
            >
              {skill}
            </span>
          ))}
        </div>
      )}

      <div className="mt-4 border-t border-border pt-3">
        <a
          href={`${issue.url}/${issue.number}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs font-medium underline-offset-4 hover:underline"
        >
          Open issue ↗
        </a>
      </div>
    </div>
  );
}
