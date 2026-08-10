import { SUBMISSION_STATUS_LABELS, type ReviewTimelineEvent } from "@/types/submission";

type ReviewTimelineProps = {
  events: ReviewTimelineEvent[];
};

export function ReviewTimeline({ events }: ReviewTimelineProps) {
  if (events.length === 0) {
    return <p className="text-sm text-muted-foreground">No review activity yet.</p>;
  }

  return (
    <ol className="relative space-y-4 border-l border-border pl-5">
      {events.map((event) => (
        <li key={event.id} className="relative">
          <span
            aria-hidden
            className="absolute top-1.5 -left-[1.4rem] size-2.5 rounded-none border border-border bg-primary/80"
          />
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium text-foreground">
                {event.type === "comment"
                  ? "Comment"
                  : event.toStatus
                    ? SUBMISSION_STATUS_LABELS[event.toStatus]
                    : "Update"}
              </p>
              <span className="font-mono text-[11px] text-muted-foreground">
                {formatDate(event.createdAt)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {event.actorDisplayName ?? event.actorUsername ?? "System"}
              {event.type === "status_change" && event.fromStatus
                ? ` · ${SUBMISSION_STATUS_LABELS[event.fromStatus]} → ${
                    event.toStatus ? SUBMISSION_STATUS_LABELS[event.toStatus] : "-"
                  }`
                : null}
            </p>
            {event.body ? (
              <p className="text-sm leading-relaxed text-muted-foreground">
                {event.body}
              </p>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("en", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}
