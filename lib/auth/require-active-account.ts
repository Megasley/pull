import type { BuilderProfile } from "@/types/user";

import {
  canUsePlatformFeatures,
  type UserAccountStatus,
} from "@/lib/auth/account-status";
import { bootstrapCurrentUserProfile } from "@/lib/auth/session";

export type ActiveAccountGate =
  | {
      ok: true;
      profile: BuilderProfile;
    }
  | {
      ok: false;
      reason: "unauthenticated" | "suspended" | "banned";
      status?: UserAccountStatus;
    };

export async function requireActiveAccount(): Promise<ActiveAccountGate> {
  const profile = await bootstrapCurrentUserProfile();

  if (!profile) {
    return { ok: false, reason: "unauthenticated" };
  }

  if (!canUsePlatformFeatures(profile.accountStatus)) {
    return {
      ok: false,
      reason: profile.accountStatus === "banned" ? "banned" : "suspended",
      status: profile.accountStatus,
    };
  }

  return { ok: true, profile };
}

export function moderationBlockedMessage(
  reason: Exclude<ActiveAccountGate, { ok: true }>["reason"],
) {
  switch (reason) {
    case "suspended":
      return "Your account is suspended. Submissions and reviews are disabled until an admin restores access.";
    case "banned":
      return "Your account has been banned.";
    default:
      return "Sign in to continue.";
  }
}
