import { listThreadsForEntityAction } from "@/app/actions/comments";
import { CommentActions } from "@/components/comments/comment-actions";
import { QuestionComposer } from "@/components/comments/question-composer";
import { ReplyComposer } from "@/components/comments/reply-composer";
import { ReplyList } from "@/components/comments/reply-list";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getCurrentUser } from "@/lib/auth/session";
import { linkifyText } from "@/lib/comments/linkify";
import type { CommentEntityInput } from "@/types/comments";

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

function initialsFor(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function excerpt(body: string, maxLength = 72) {
  const collapsed = body.replace(/\s+/g, " ").trim();
  return collapsed.length > maxLength
    ? `${collapsed.slice(0, maxLength).trimEnd()}…`
    : collapsed;
}

function questionAnchorId(threadId: string) {
  return `comment-question-${threadId}`;
}

type CommentThreadProps = {
  entity: CommentEntityInput;
};

export async function CommentThread({ entity }: CommentThreadProps) {
  const [result, viewer] = await Promise.all([
    listThreadsForEntityAction(entity),
    getCurrentUser(),
  ]);

  if (!result.ok) {
    return null;
  }

  const { threads } = result;
  const viewerId = viewer?.id ?? null;

  return (
    <div className="space-y-6">
      <QuestionComposer entity={entity} />

      {threads.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No questions yet — be the first to ask.
        </p>
      ) : (
        <>
          {threads.length > 1 ? (
            <nav aria-label="Jump to a question" className="space-y-2">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {threads.length} questions
              </p>
              <ol className="space-y-1 border-l border-border pl-3 text-sm">
                {threads.map((thread) => (
                  <li key={thread.id}>
                    <a
                      href={`#${questionAnchorId(thread.id)}`}
                      className="block py-0.5 text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {thread.status === "deleted" ? "[deleted]" : excerpt(thread.body)}
                      {thread.hasAcceptedAnswer ? " ✓" : ""}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          ) : null}

          <ol className="space-y-6">
            {threads.map((thread) => (
              <li
                key={thread.id}
                id={questionAnchorId(thread.id)}
                className="scroll-mt-24 space-y-4 rounded-none border border-border bg-card p-4"
              >
                <div className="flex items-start gap-2.5">
                  <Avatar size="sm" className="mt-0.5">
                    {thread.author?.avatarUrl ? (
                      <AvatarImage
                        src={thread.author.avatarUrl}
                        alt={thread.author.displayName}
                      />
                    ) : null}
                    <AvatarFallback className="text-[10px]">
                      {initialsFor(thread.author?.displayName ?? "?")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-foreground">
                        {thread.author?.displayName ?? "[deleted]"}
                      </p>
                      <span className="font-mono text-[11px] text-muted-foreground">
                        {formatDate(thread.createdAt)}
                      </span>
                      {thread.hasAcceptedAnswer ? (
                        <span className="rounded-none border border-ink/30 bg-signal/20 px-1.5 py-0.5 font-mono text-[10px] tracking-[0.08em] text-foreground uppercase">
                          Resolved
                        </span>
                      ) : null}
                    </div>
                    <p className="text-sm leading-relaxed">
                      {thread.status === "deleted"
                        ? "[deleted]"
                        : linkifyText(thread.body)}
                    </p>
                    {viewerId !== null &&
                    viewerId === thread.author?.id &&
                    thread.status === "visible" ? (
                      <CommentActions commentId={thread.id} initialBody={thread.body} />
                    ) : null}
                  </div>
                </div>

                <div className="pl-[calc(1.5rem+0.625rem)]">
                  <ReplyList
                    replies={thread.replies}
                    viewerId={viewerId}
                    canAcceptAnswer={
                      !thread.hasAcceptedAnswer &&
                      viewerId !== null &&
                      viewerId === thread.author?.id
                    }
                  />
                </div>

                {thread.status === "visible" ? (
                  <div className="pl-[calc(1.5rem+0.625rem)]">
                    <ReplyComposer threadId={thread.id} />
                  </div>
                ) : null}
              </li>
            ))}
          </ol>
        </>
      )}
    </div>
  );
}
