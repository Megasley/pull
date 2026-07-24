import { Inbox } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { H4, Muted } from "./typography";

type EmptyStateProps = {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
};

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-none border border-dashed border-border bg-transparent px-6 py-14 text-center",
        className,
      )}
    >
      <div className="mb-4 flex size-12 items-center justify-center rounded-none border border-border bg-muted/40 text-muted-foreground">
        {icon ?? <Inbox className="size-5" aria-hidden />}
      </div>
      <H4 className="text-balance">{title}</H4>
      {description ? (
        <Muted className="mt-2 max-w-sm text-balance font-mono text-xs">
          {description}
        </Muted>
      ) : null}
      {actionLabel ? (
        <div className="mt-6">
          {actionHref ? (
            <Button asChild>
              <a href={actionHref}>{actionLabel}</a>
            </Button>
          ) : (
            <Button onClick={onAction}>{actionLabel}</Button>
          )}
        </div>
      ) : null}
    </div>
  );
}
