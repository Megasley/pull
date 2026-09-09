"use server";

import { revalidatePath } from "next/cache";

import { refreshAdminMetricsSnapshot } from "@/lib/admin/metrics-snapshot";
import {
  banUser,
  deleteUser,
  getAdminUserById,
  restoreUser,
  suspendUser,
  updateUserRole,
} from "@/lib/admin/repository";
import { isAdminRole } from "@/lib/auth/roles";
import { bootstrapCurrentUserProfile, getCurrentUser } from "@/lib/auth/session";
import type { UserRole } from "@/types/submission";

const VALID_ROLES: UserRole[] = ["builder", "reviewer", "admin"];

export async function requireAdmin() {
  const user = await getCurrentUser();

  if (!user) {
    return { ok: false as const, reason: "unauthenticated" as const };
  }

  const profile = await bootstrapCurrentUserProfile();

  if (!profile || !isAdminRole(profile.role)) {
    return { ok: false as const, reason: "forbidden" as const };
  }

  return { ok: true as const, user, profile };
}

function roleErrorMessage(reason: string) {
  switch (reason) {
    case "last_admin":
      return "Cannot demote the last remaining admin.";
    case "self_demote":
      return "You cannot demote yourself. Ask another admin.";
    case "not_found":
      return "User not found.";
    default:
      return "Could not update role.";
  }
}

export async function updateUserRoleAction(userId: string, role: UserRole) {
  const gate = await requireAdmin();

  if (!gate.ok) {
    return { ok: false as const, reason: gate.reason };
  }

  if (!VALID_ROLES.includes(role)) {
    return {
      ok: false as const,
      reason: "invalid_role" as const,
      error: "Invalid role.",
    };
  }

  const result = await updateUserRole({
    userId,
    role,
    actorUserId: gate.user.id,
  });

  if (!result.ok) {
    return {
      ok: false as const,
      reason: result.reason,
      error: roleErrorMessage(result.reason),
    };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
  return { ok: true as const, user: result.user };
}

function moderationErrorMessage(reason: string) {
  switch (reason) {
    case "not_found":
      return "User not found.";
    default:
      return "Could not update account status.";
  }
}

export async function suspendUserAction(userId: string, reason?: string) {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return { ok: false as const, reason: gate.reason };
  }

  const result = await suspendUser({
    userId,
    actorUserId: gate.user.id,
    reason,
  });

  if (!result.ok) {
    return {
      ok: false as const,
      reason: result.reason,
      error: moderationErrorMessage(result.reason),
    };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
  return { ok: true as const, user: result.user };
}

export async function banUserAction(userId: string, reason?: string) {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return { ok: false as const, reason: gate.reason };
  }

  const result = await banUser({
    userId,
    actorUserId: gate.user.id,
    reason,
  });

  if (!result.ok) {
    return {
      ok: false as const,
      reason: result.reason,
      error: moderationErrorMessage(result.reason),
    };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
  return { ok: true as const, user: result.user };
}

export async function restoreUserAction(userId: string) {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return { ok: false as const, reason: gate.reason };
  }

  const result = await restoreUser({
    userId,
    actorUserId: gate.user.id,
  });

  if (!result.ok) {
    return {
      ok: false as const,
      reason: result.reason,
      error: moderationErrorMessage(result.reason),
    };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
  return { ok: true as const, user: result.user };
}

function deleteUserErrorMessage(reason: string) {
  switch (reason) {
    case "not_found":
      return "User not found.";
    case "self_delete":
      return "You cannot delete your own account. Ask another admin.";
    case "last_admin":
      return "Cannot delete the last remaining admin.";
    default:
      return "Could not delete user.";
  }
}

/**
 * Requires the admin to type the user's exact username as a confirmation —
 * checked server-side, not just in the UI, since this is irreversible.
 */
export async function deleteUserAction(userId: string, confirmUsername: string) {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return { ok: false as const, reason: gate.reason };
  }

  const target = await getAdminUserById(userId);
  if (!target) {
    return {
      ok: false as const,
      reason: "not_found" as const,
      error: deleteUserErrorMessage("not_found"),
    };
  }

  if (confirmUsername.trim() !== target.username) {
    return {
      ok: false as const,
      reason: "confirmation_mismatch" as const,
      error: "Type the username exactly to confirm.",
    };
  }

  const result = await deleteUser({ userId, actorUserId: gate.user.id });

  if (!result.ok) {
    return {
      ok: false as const,
      reason: result.reason,
      error: deleteUserErrorMessage(result.reason),
    };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/users");

  return {
    ok: true as const,
    authDeleted: result.authDeleted,
    authDeleteError: result.authDeleteError,
  };
}

/** Manually recompute launch/funnel metrics snapshot (same work as the cron). */
export async function refreshAdminMetricsAction() {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return { ok: false as const, reason: gate.reason };
  }

  const result = await refreshAdminMetricsSnapshot();
  revalidatePath("/admin");

  if (!result.ok) {
    return {
      ok: false as const,
      reason: "refresh_failed" as const,
      error: result.error ?? "Could not refresh metrics.",
      computedAt: result.computedAt,
    };
  }

  return {
    ok: true as const,
    computedAt: result.computedAt,
  };
}
