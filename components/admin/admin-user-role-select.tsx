"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { updateUserRoleAction } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import type { UserRole } from "@/types/submission";

const ROLES: UserRole[] = ["builder", "reviewer", "admin"];

type AdminUserRoleSelectProps = {
  userId: string;
  currentRole: UserRole;
  isSelf: boolean;
};

export function AdminUserRoleSelect({
  userId,
  currentRole,
  isSelf,
}: AdminUserRoleSelectProps) {
  const router = useRouter();
  const [role, setRole] = useState<UserRole>(currentRole);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const dirty = role !== currentRole;

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await updateUserRoleAction(userId, role);

      if (!result.ok) {
        if (result.reason === "unauthenticated") {
          router.push("/sign-in?next=/admin/users");
          return;
        }

        setError(
          "error" in result && result.error
            ? result.error
            : result.reason === "forbidden"
              ? "Admin access required."
              : "Could not update role.",
        );
        setRole(currentRole);
        return;
      }

      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        <select
          value={role}
          disabled={pending}
          onChange={(event) => setRole(event.target.value as UserRole)}
          aria-label="User role"
          className="rounded-none border border-border bg-transparent px-2 py-1.5 font-mono text-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {ROLES.map((value) => (
            <option key={value} value={value}>
              {value}
              {isSelf && value === "admin" ? " (you)" : ""}
            </option>
          ))}
        </select>
        <Button
          type="button"
          size="sm"
          variant="outline"
          loading={pending}
          disabled={!dirty}
          onClick={save}
        >
          Save
        </Button>
      </div>
      {error ? (
        <p className="max-w-[220px] text-right text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
