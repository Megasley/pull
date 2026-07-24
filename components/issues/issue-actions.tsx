"use client";

import { useCallback, useSyncExternalStore } from "react";
import { Bookmark, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  dismissIssue,
  getDismissedIssueIds,
  getSavedIssueIds,
  getServerIssueIds,
  isIssueSaved,
  subscribeIssuePreferences,
  toggleSavedIssue,
} from "@/lib/issues/preferences";
import { cn } from "@/lib/utils";

type IssueActionsProps = {
  issueId: string;
  className?: string;
};

function savedSnapshot(id: string) {
  return isIssueSaved(id) ? "1" : "0";
}

export function IssueSaveButton({ issueId, className }: IssueActionsProps) {
  const saved =
    useSyncExternalStore(
      subscribeIssuePreferences,
      () => savedSnapshot(issueId),
      () => "0",
    ) === "1";

  const onToggle = useCallback(() => {
    toggleSavedIssue(issueId);
  }, [issueId]);

  return (
    <Button
      type="button"
      size="sm"
      variant={saved ? "secondary" : "outline"}
      onClick={onToggle}
      aria-pressed={saved}
      className={cn(className)}
    >
      <Bookmark className={cn("size-4", saved && "fill-current")} aria-hidden />
      {saved ? "Saved" : "Save"}
    </Button>
  );
}

export function IssueDismissButton({ issueId, className }: IssueActionsProps) {
  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      className={cn(className)}
      onClick={() => dismissIssue(issueId)}
      aria-label="Dismiss recommendation"
    >
      <X className="size-4" aria-hidden />
      Dismiss
    </Button>
  );
}

export function useIssuePreferenceIds() {
  const savedIssueIds = useSyncExternalStore(
    subscribeIssuePreferences,
    getSavedIssueIds,
    getServerIssueIds,
  );
  const dismissedIssueIds = useSyncExternalStore(
    subscribeIssuePreferences,
    getDismissedIssueIds,
    getServerIssueIds,
  );

  return { savedIssueIds, dismissedIssueIds };
}
