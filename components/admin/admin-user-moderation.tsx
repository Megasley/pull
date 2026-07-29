"use client";

import { useState, useTransition } from "react";

import {
  banUserAction,
  restoreUserAction,
  suspendUserAction,
} from "@/app/actions/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { UserAccountStatus } from "@/lib/auth/account-status";

type AdminUserModerationProps = {
  userId: string;
  accountStatus: UserAccountStatus;
  moderationReason: string | null;
};

export function AdminUserModeration({
  userId,
  accountStatus,
  moderationReason,
}: AdminUserModerationProps) {
  const [reason, setReason] = useState(moderationReason ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run(action: "suspend" | "ban" | "restore") {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result =
        action === "restore"
          ? await restoreUserAction(userId)
          : action === "ban"
            ? await banUserAction(userId, reason)
            : await suspendUserAction(userId, reason);

      if (!result.ok) {
        setError(result.error ?? "Action failed.");
        return;
      }

      setMessage(
        action === "restore"
          ? "Account restored."
          : action === "ban"
            ? "User banned."
            : "User suspended.",
      );
    });
  }

  return (
    <div className="space-y-4 rounded-none border border-border bg-card p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-sm font-semibold tracking-tight">Moderation</h2>
        <Badge variant={accountStatus === "active" ? "secondary" : "destructive"}>
          {accountStatus}
        </Badge>
      </div>

      <label className="block space-y-1">
        <span className="text-xs text-muted-foreground">Reason (optional)</span>
        <textarea
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          rows={3}
          className="w-full rounded-none border border-border bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring"
          placeholder="Internal note shown to the user when suspended"
        />
      </label>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={pending || accountStatus === "suspended"}
          onClick={() => run("suspend")}
        >
          Suspend
        </Button>
        <Button
          type="button"
          variant="destructive"
          disabled={pending || accountStatus === "banned"}
          onClick={() => run("ban")}
        >
          Ban
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={pending || accountStatus === "active"}
          onClick={() => run("restore")}
        >
          Restore
        </Button>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
    </div>
  );
}
