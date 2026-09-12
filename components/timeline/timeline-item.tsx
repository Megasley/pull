import {
  CheckCircleIcon,
  CircleDotIcon,
  ExternalLinkIcon,
  FileCodeIcon,
  GitCommitIcon,
  GitMergeIcon,
  GitPullRequestIcon,
  MapIcon,
  MessageSquareIcon,
} from "@/components/icons/outline-icons";

import { Badge } from "@/components/ui/badge";
import { TIMELINE_TYPE_SINGULAR } from "@/lib/timeline/filter";
import { cn } from "@/lib/utils";
import type { TimelineEvent, TimelineEventType } from "@/types/timeline";

const TYPE_ICON: Record<
  TimelineEventType,
  React.ComponentType<{ className?: string }>
> = {
  commit: GitCommitIcon,
  pull_request: GitPullRequestIcon,
  issue: CircleDotIcon,
  review: MessageSquareIcon,
  merged: GitMergeIcon,
  project_submission: FileCodeIcon,
  roadmap_completion: MapIcon,
  qa_answer_accepted: CheckCircleIcon,
};

const TYPE_TONE: Record<TimelineEventType, string> = {
  commit: "bg-foreground/10 text-foreground",
  pull_request: "bg-ink/10 text-ink",
  issue: "bg-muted text-foreground",
  review: "bg-secondary text-secondary-foreground",
  merged: "bg-signal/40 text-ink",
  project_submission: "bg-foreground/10 text-foreground",
  roadmap_completion: "bg-signal/25 text-ink",
  qa_answer_accepted: "bg-signal/40 text-ink",
};

type TimelineItemProps = {
  event: TimelineEvent;
  index: number;
  profile?: boolean;
  groupCount?: number;
};

// Time-only is ambiguous for anything but today (e.g. "8:17 AM" from last
// week tells you nothing) — so fall back to a date, and add the year once
// the event is old enough that "this year" isn't a safe assumption.
function formatEventTimestamp(occurredAt: string): string | null {
  if (!Number.isFinite(Date.parse(occurredAt))) return null;
  const date = new Date(occurredAt);
  const now = new Date();

  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  }

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: date.getFullYear() === now.getFullYear() ? undefined : "numeric",
  });
}

export function TimelineItem({
  event,
  index,
  profile = false,
  groupCount,
}: TimelineItemProps) {
  const Icon = TYPE_ICON[event.type];
  const time = formatEventTimestamp(event.occurredAt);

  if (profile) {
    const content = (
      <>
        <div className="profile-tl-dot">
          <Icon className="size-3.5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10.5px] text-muted-foreground">
            <span className="font-semibold text-foreground/80">
              {TIMELINE_TYPE_SINGULAR[event.type]}
            </span>
            {event.meta ? ` · ${event.meta}` : ""}
            {time ? ` · ${time}` : ""}
          </p>
          <p className="text-[13.5px] font-semibold">
            {event.title}
            {groupCount && groupCount > 1 ? (
              <span className="profile-tl-group-count">×{groupCount}</span>
            ) : null}
          </p>
          <p className="text-xs text-muted-foreground">{event.description}</p>
        </div>
        {event.href ? (
          <ExternalLinkIcon className="size-3.5 shrink-0 text-muted-foreground opacity-50" />
        ) : null}
      </>
    );

    if (event.href) {
      const external = event.href.startsWith("http");
      return (
        <a
          href={event.href}
          className="profile-tl-item group transition-colors hover:bg-muted/20"
          {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
        >
          {content}
        </a>
      );
    }

    return <div className="profile-tl-item">{content}</div>;
  }

  const content = (
    <>
      <div
        className={cn(
          "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-none",
          TYPE_TONE[event.type],
        )}
      >
        <Icon className="size-4" aria-hidden />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="text-[10px]">
            {TIMELINE_TYPE_SINGULAR[event.type]}
          </Badge>
          {event.meta ? (
            <span className="font-mono text-[11px] text-muted-foreground">
              {event.meta}
            </span>
          ) : null}
          {time ? (
            <span className="text-[11px] text-muted-foreground">{time}</span>
          ) : null}
          {event.type === "merged" ? (
            <CheckCircleIcon className="size-3.5 text-ink" />
          ) : null}
        </div>
        <p className="mt-1 truncate text-sm font-medium">{event.title}</p>
        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
          {event.description}
        </p>
      </div>

      {event.href ? (
        <ExternalLinkIcon className="size-3.5 shrink-0 text-muted-foreground opacity-50 transition-opacity group-hover:opacity-100" />
      ) : null}
    </>
  );

  const className = cn(
    "group animate-fade-in-up flex items-start gap-3 rounded-none border border-border bg-card px-3.5 py-3 transition-colors hover:bg-card",
  );

  const style = {
    animationDelay: `${Math.min(index, 16) * 45}ms`,
  } as React.CSSProperties;

  if (event.href) {
    const external = event.href.startsWith("http");
    return (
      <a
        href={event.href}
        className={className}
        style={style}
        {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
      >
        {content}
      </a>
    );
  }

  return (
    <div className={className} style={style}>
      {content}
    </div>
  );
}
