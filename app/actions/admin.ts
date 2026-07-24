"use server";

import { revalidatePath } from "next/cache";

import { isAdminRole } from "@/lib/auth/roles";
import { bootstrapCurrentUserProfile, getCurrentUser } from "@/lib/auth/session";
import { updateUserRole } from "@/lib/admin/repository";
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
  return { ok: true as const, user: result.user };
}
