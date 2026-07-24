"use client";

import { useCallback, useSyncExternalStore } from "react";
import { Bookmark } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  isProjectBookmarked,
  subscribeProjectBookmarks,
  toggleProjectBookmark,
} from "@/lib/projects/bookmarks";
import { cn } from "@/lib/utils";

type ProjectBookmarkButtonProps = {
  slug: string;
  className?: string;
};

function getBookmarkSnapshot(slug: string) {
  return isProjectBookmarked(slug) ? "1" : "0";
}

function getServerBookmarkSnapshot() {
  return "0";
}

export function ProjectBookmarkButton({
  slug,
  className,
}: ProjectBookmarkButtonProps) {
  const bookmarked =
    useSyncExternalStore(
      subscribeProjectBookmarks,
      () => getBookmarkSnapshot(slug),
      getServerBookmarkSnapshot,
    ) === "1";

  const onToggle = useCallback(() => {
    toggleProjectBookmark(slug);
  }, [slug]);

  return (
    <Button
      type="button"
      variant={bookmarked ? "secondary" : "outline"}
      size="sm"
      onClick={onToggle}
      aria-pressed={bookmarked}
      className={cn(className)}
    >
      <Bookmark
        className={cn("size-4", bookmarked && "fill-current")}
        aria-hidden
      />
      {bookmarked ? "Bookmarked" : "Bookmark"}
    </Button>
  );
}
