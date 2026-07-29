export type UserAccountStatus = "active" | "suspended" | "banned";

export function normalizeAccountStatus(value: unknown): UserAccountStatus {
  if (value === "suspended" || value === "banned") {
    return value;
  }
  return "active";
}

export function isAccountActive(status: UserAccountStatus): boolean {
  return status === "active";
}

export function canUsePlatformFeatures(status: UserAccountStatus): boolean {
  return status === "active";
}

export function canSignIn(status: UserAccountStatus): boolean {
  return status !== "banned";
}

export function isPublicProfileVisible(status: UserAccountStatus): boolean {
  return status === "active";
}
