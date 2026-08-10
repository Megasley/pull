"use client";

import { useCallback, useSyncExternalStore } from "react";
import { Bookmark } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  isDiscoveryBookmarked,
  subscribeDiscoveryBookmarks,
  toggleDiscoveryBookmark,
} from "@/lib/discovery/bookmarks";
import { cn } from "@/lib/utils";

type DiscoveryBookmarkButtonProps = {
  id: string;
  className?: string;
  compact?: boolean;
};

function getSnapshot(id: string) {
  return isDiscoveryBookmarked(id) ? "1" : "0";
}

function getServerSnapshot() {
  return "0";
}

export function DiscoveryBookmarkButton({
  id,
  className,
  compact = false,
}: DiscoveryBookmarkButtonProps) {
  const bookmarked =
    useSyncExternalStore(
      subscribeDiscoveryBookmarks,
      () => getSnapshot(id),
      getServerSnapshot,
    ) === "1";

  const onToggle = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      toggleDiscoveryBookmark(id);
    },
    [id],
  );

  return (
    <Button
      type="button"
      variant={bookmarked ? "secondary" : "outline"}
      size="sm"
      onClick={onToggle}
      aria-pressed={bookmarked}
      aria-label={bookmarked ? "Remove bookmark" : "Bookmark repository"}
      className={cn(className)}
    >
      <Bookmark className={cn("size-4", bookmarked && "fill-current")} aria-hidden />
      {compact ? null : bookmarked ? "Bookmarked" : "Bookmark"}
    </Button>
  );
}
