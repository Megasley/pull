import { beforeEach, describe, expect, it, vi } from "vitest";

const authMocks = vi.hoisted(() => ({
  requireActiveAccount: vi.fn(),
  getCurrentUser: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/auth/require-active-account", () => ({
  requireActiveAccount: authMocks.requireActiveAccount,
}));
vi.mock("@/lib/auth/session", () => ({
  getCurrentUser: authMocks.getCurrentUser,
}));
vi.mock("@/lib/admin/metrics-snapshot", () => ({
  refreshAdminMetricsSnapshot: vi.fn(),
}));
vi.mock("@/lib/admin/repository", () => ({
  banUser: vi.fn(),
  restoreUser: vi.fn(),
  suspendUser: vi.fn(),
  updateUserRole: vi.fn(),
}));

import { requireAdmin } from "@/app/actions/admin";

describe("admin authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each(["suspended", "banned"] as const)(
    "rejects a %s admin before checking their role",
    async (reason) => {
      authMocks.requireActiveAccount.mockResolvedValue({ ok: false, reason });

      await expect(requireAdmin()).resolves.toEqual({ ok: false, reason });
      expect(authMocks.getCurrentUser).not.toHaveBeenCalled();
    },
  );

  it("rejects an active non-admin", async () => {
    authMocks.requireActiveAccount.mockResolvedValue({
      ok: true,
      profile: { id: "builder-id", role: "builder", accountStatus: "active" },
    });

    await expect(requireAdmin()).resolves.toEqual({
      ok: false,
      reason: "forbidden",
    });
  });

  it("allows an active admin", async () => {
    const profile = { id: "admin-id", role: "admin", accountStatus: "active" };
    const user = { id: "admin-id" };
    authMocks.requireActiveAccount.mockResolvedValue({ ok: true, profile });
    authMocks.getCurrentUser.mockResolvedValue(user);

    await expect(requireAdmin()).resolves.toEqual({ ok: true, user, profile });
  });
});
