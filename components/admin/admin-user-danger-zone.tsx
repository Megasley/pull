"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { deleteUserAction } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";

type AdminUserDangerZoneProps = {
  userId: string;
  username: string;
  isSelf: boolean;
};

export function AdminUserDangerZone({ userId, username, isSelf }: AdminUserDangerZoneProps) {
  const router = useRouter();
  const [confirmUsername, setConfirmUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const canDelete = !isSelf && confirmUsername.trim() === username;

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteUserAction(userId, confirmUsername.trim());

      if (!result.ok) {
        setError(result.error ?? "Could not delete user.");
        return;
      }

      if (!result.authDeleted) {
        // Their profile and every cascaded row are gone; only their
        // Supabase Auth login (still valid) couldn't be removed. Flag it
        // clearly rather than letting the admin believe access was fully
        // revoked — see lib/admin/repository.ts:deleteUser.
        router.push(
          `/admin/users?deleted=${encodeURIComponent(username)}&authWarning=1`,
        );
        return;
      }

      router.push(`/admin/users?deleted=${encodeURIComponent(username)}`);
    });
  }

  return (
    <div className="space-y-4 rounded-none border border-destructive/40 bg-destructive/5 p-4">
      <div>
        <h2 className="text-sm font-semibold tracking-tight text-destructive">
          Danger zone
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Permanently deletes @{username}&apos;s profile, GitHub sync data, milestones,
          achievements, submissions, org memberships, and their Supabase Auth login.
          This cannot be undone.
        </p>
      </div>

      {isSelf ? (
        <p className="text-sm text-muted-foreground">
          You cannot delete your own account. Ask another admin.
        </p>
      ) : (
        <>
          <label className="block space-y-1">
            <span className="text-xs text-muted-foreground">
              Type <span className="font-mono font-medium text-foreground">{username}</span>{" "}
              to confirm
            </span>
            <input
              type="text"
              value={confirmUsername}
              onChange={(event) => setConfirmUsername(event.target.value)}
              disabled={pending}
              autoComplete="off"
              spellCheck={false}
              className="w-full max-w-xs rounded-none border border-border bg-transparent px-3 py-2 font-mono text-sm outline-none focus-visible:border-ring"
              placeholder={username}
            />
          </label>

          <Button
            type="button"
            variant="destructive"
            disabled={!canDelete || pending}
            onClick={handleDelete}
          >
            {pending ? "Deleting…" : "Delete user permanently"}
          </Button>
        </>
      )}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
