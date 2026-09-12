import { AcceptAnswerButton } from "@/components/comments/accept-answer-button";
import { CommentActions } from "@/components/comments/comment-actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { linkifyText } from "@/lib/comments/linkify";
import type { CommentReplyRecord } from "@/types/comments";

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

type ReplyListProps = {
  replies: CommentReplyRecord[];
  /** True when the viewer is the question's author and no reply is accepted
   *  yet — the only time an "Accept as answer" button is shown. */
  canAcceptAnswer: boolean;
  viewerId: string | null;
};

export function ReplyList({ replies, canAcceptAnswer, viewerId }: ReplyListProps) {
  if (replies.length === 0) {
    return null;
  }

  return (
    <ol className="relative space-y-4 border-l border-border pl-5">
      {replies.map((reply) => (
        <li key={reply.id} className="relative">
          <span
            aria-hidden
            className="absolute top-1.5 -left-[1.4rem] size-2.5 rounded-none border border-border bg-primary/80"
          />
          <div className="flex items-start gap-2.5">
            <Avatar size="sm" className="mt-0.5">
              {reply.author?.avatarUrl ? (
                <AvatarImage src={reply.author.avatarUrl} alt={reply.author.displayName} />
              ) : null}
              <AvatarFallback className="text-[10px]">
                {initialsFor(reply.author?.displayName ?? "?")}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium text-foreground">
                  {reply.author?.displayName ?? "[deleted]"}
                </p>
                <span className="font-mono text-[11px] text-muted-foreground">
                  {formatDate(reply.createdAt)}
                </span>
                {reply.isAcceptedAnswer ? (
                  <span className="rounded-none border border-ink/30 bg-signal/20 px-1.5 py-0.5 font-mono text-[10px] tracking-[0.08em] text-foreground uppercase">
                    Accepted answer
                  </span>
                ) : null}
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {reply.status === "deleted" ? "[deleted]" : linkifyText(reply.body)}
              </p>
              {canAcceptAnswer && reply.status === "visible" ? (
                <AcceptAnswerButton replyId={reply.id} />
              ) : null}
              {viewerId !== null &&
              viewerId === reply.author?.id &&
              reply.status === "visible" ? (
                <CommentActions commentId={reply.id} initialBody={reply.body} />
              ) : null}
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
