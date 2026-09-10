import { beforeEach, describe, expect, it, vi } from "vitest";

const repositoryMocks = vi.hoisted(() => ({
  getDb: vi.fn(),
  recordAdminAction: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  getDb: repositoryMocks.getDb,
  getPostgresClient: vi.fn(),
  withDbRetry: vi.fn(),
}));
vi.mock("@/lib/db/env", () => ({
  isDatabaseConfigured: () => true,
}));
vi.mock("@/lib/admin/audit-log", () => ({
  recordAdminAction: repositoryMocks.recordAdminAction,
}));

import { banUser, suspendUser, updateUserRole } from "@/lib/admin/repository";

type TestUser = {
  id: string;
  username: string;
  displayName: string;
  avatar: null;
  githubUsername: string;
  role: "builder" | "reviewer" | "admin";
  accountStatus: "active" | "suspended" | "banned";
  moderationReason: string | null;
  moderatedAt: string | null;
  moderatedBy: string | null;
  onboardingCompletedAt: string | null;
  preferredRoadmapSlug: string | null;
  country: string | null;
  acquisitionSource: null;
  xp: number;
  level: number;
  createdAt: string;
  updatedAt: string;
};

function admin(id: string): TestUser {
  return {
    id,
    username: id,
    displayName: id,
    avatar: null,
    githubUsername: id,
    role: "admin",
    accountStatus: "active",
    moderationReason: null,
    moderatedAt: null,
    moderatedBy: null,
    onboardingCompletedAt: null,
    preferredRoadmapSlug: null,
    country: null,
    acquisitionSource: null,
    xp: 0,
    level: 1,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

function createDbHarness(
  targets: string[],
  options?: { users?: TestUser[]; failSessionRevocation?: boolean },
) {
  const initialUsers = options?.users ?? [admin("admin-a"), admin("admin-b")];
  const state = new Map<string, TestUser>(initialUsers.map((user) => [user.id, user]));
  const revokedSessions: string[] = [];
  let nextTarget = 0;
  let lockTail = Promise.resolve();

  async function acquireLock() {
    const previous = lockTail;
    let release = () => {};
    lockTail = new Promise<void>((resolve) => {
      release = resolve;
    });
    await previous;
    return release;
  }

  const db = {
    transaction: vi.fn(async (operation: (transaction: object) => Promise<unknown>) => {
      const targetId = targets[nextTarget++];
      if (!targetId) throw new Error("Missing transaction target");
      const originalTarget = state.get(targetId);
      const targetSnapshot = originalTarget ? { ...originalTarget } : undefined;

      let releaseLock: (() => void) | undefined;
      let executeCalls = 0;
      const transaction = {
        execute: async () => {
          if (executeCalls++ === 0) {
            releaseLock = await acquireLock();
          } else {
            if (options?.failSessionRevocation) {
              throw new Error("Session revocation failed");
            }
            revokedSessions.push(targetId);
          }
          return [];
        },
        select: (selection?: Record<string, unknown>) => ({
          from: () => ({
            where: () =>
              selection
                ? [
                    {
                      value: [...state.values()].filter(
                        (user) =>
                          user.role === "admin" && user.accountStatus === "active",
                      ).length,
                    },
                  ]
                : {
                    limit: () => {
                      const user = state.get(targetId);
                      return user ? [{ ...user }] : [];
                    },
                  },
          }),
        }),
        update: () => ({
          set: (patch: Partial<TestUser>) => ({
            where: () => ({
              returning: () => {
                const user = state.get(targetId);
                if (!user) return [];
                Object.assign(user, patch);
                return [{ ...user }];
              },
            }),
          }),
        }),
      };

      try {
        return await operation(transaction);
      } catch (error) {
        if (targetSnapshot) state.set(targetId, targetSnapshot);
        throw error;
      } finally {
        releaseLock?.();
      }
    }),
  };

  return { db, state, revokedSessions };
}

describe("admin repository last-active-admin invariant", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows only one of two concurrent admin moderation attempts", async () => {
    const harness = createDbHarness(["admin-b", "admin-a"]);
    repositoryMocks.getDb.mockReturnValue(harness.db);

    const results = await Promise.all([
      banUser({ userId: "admin-b", actorUserId: "admin-a" }),
      banUser({ userId: "admin-a", actorUserId: "admin-b" }),
    ]);

    expect(results.filter((result) => result.ok)).toHaveLength(1);
    expect(results.filter((result) => !result.ok)).toEqual([
      { ok: false, reason: "last_admin" },
    ]);
    expect(
      [...harness.state.values()].filter(
        (user) => user.role === "admin" && user.accountStatus === "active",
      ),
    ).toHaveLength(1);
    expect(harness.revokedSessions).toEqual(["admin-b"]);
    expect(repositoryMocks.recordAdminAction).toHaveBeenCalledTimes(1);
  });

  it("serializes concurrent moderation and demotion attempts", async () => {
    const harness = createDbHarness(["admin-b", "admin-a"]);
    repositoryMocks.getDb.mockReturnValue(harness.db);

    const results = await Promise.all([
      banUser({ userId: "admin-b", actorUserId: "admin-a" }),
      updateUserRole({
        userId: "admin-a",
        actorUserId: "admin-b",
        role: "builder",
      }),
    ]);

    expect(results.filter((result) => result.ok)).toHaveLength(1);
    expect(results.filter((result) => !result.ok)).toEqual([
      { ok: false, reason: "last_admin" },
    ]);
    expect(
      [...harness.state.values()].filter(
        (user) => user.role === "admin" && user.accountStatus === "active",
      ),
    ).toHaveLength(1);
    expect(harness.revokedSessions).toEqual(["admin-b"]);
    expect(repositoryMocks.recordAdminAction).toHaveBeenCalledTimes(1);
  });

  it("still rejects self-moderation without revoking sessions", async () => {
    const harness = createDbHarness(["admin-a"]);
    repositoryMocks.getDb.mockReturnValue(harness.db);

    await expect(
      banUser({ userId: "admin-a", actorUserId: "admin-a" }),
    ).resolves.toEqual({ ok: false, reason: "self_moderation" });
    expect(harness.revokedSessions).toEqual([]);
    expect(repositoryMocks.recordAdminAction).not.toHaveBeenCalled();
  });

  it("rejects self-demotion without changing the role", async () => {
    const harness = createDbHarness(["admin-a"]);
    repositoryMocks.getDb.mockReturnValue(harness.db);

    await expect(
      updateUserRole({
        userId: "admin-a",
        actorUserId: "admin-a",
        role: "builder",
      }),
    ).resolves.toEqual({ ok: false, reason: "self_demote" });
    expect(harness.state.get("admin-a")?.role).toBe("admin");
    expect(repositoryMocks.recordAdminAction).not.toHaveBeenCalled();
  });

  it("rejects blocking the last active admin without partial changes", async () => {
    const harness = createDbHarness(["admin-a"], { users: [admin("admin-a")] });
    repositoryMocks.getDb.mockReturnValue(harness.db);

    await expect(
      banUser({ userId: "admin-a", actorUserId: "admin-b" }),
    ).resolves.toEqual({ ok: false, reason: "last_admin" });
    expect(harness.state.get("admin-a")?.accountStatus).toBe("active");
    expect(harness.revokedSessions).toEqual([]);
    expect(repositoryMocks.recordAdminAction).not.toHaveBeenCalled();
  });

  it("rejects demoting the last active admin without changing the role", async () => {
    const harness = createDbHarness(["admin-a"], { users: [admin("admin-a")] });
    repositoryMocks.getDb.mockReturnValue(harness.db);

    await expect(
      updateUserRole({
        userId: "admin-a",
        actorUserId: "admin-b",
        role: "builder",
      }),
    ).resolves.toEqual({ ok: false, reason: "last_admin" });
    expect(harness.state.get("admin-a")?.role).toBe("admin");
    expect(repositoryMocks.recordAdminAction).not.toHaveBeenCalled();
  });

  it.each([
    ["suspend", suspendUser, "suspended"],
    ["ban", banUser, "banned"],
  ] as const)("%ss a user and revokes their sessions", async (_, action, status) => {
    const harness = createDbHarness(["admin-b"]);
    repositoryMocks.getDb.mockReturnValue(harness.db);

    const result = await action({
      userId: "admin-b",
      actorUserId: "admin-a",
    });

    expect(result.ok).toBe(true);
    expect(harness.state.get("admin-b")?.accountStatus).toBe(status);
    expect(harness.revokedSessions).toEqual(["admin-b"]);
    expect(repositoryMocks.recordAdminAction).toHaveBeenCalledTimes(1);
  });

  it("allows demotion when another active admin remains", async () => {
    const harness = createDbHarness(["admin-b"]);
    repositoryMocks.getDb.mockReturnValue(harness.db);

    const result = await updateUserRole({
      userId: "admin-b",
      actorUserId: "admin-a",
      role: "builder",
    });

    expect(result.ok).toBe(true);
    expect(harness.state.get("admin-b")?.role).toBe("builder");
    expect(harness.state.get("admin-a")?.role).toBe("admin");
    expect(repositoryMocks.recordAdminAction).toHaveBeenCalledTimes(1);
  });

  it("rolls back the account change when session revocation fails", async () => {
    const harness = createDbHarness(["admin-b"], {
      failSessionRevocation: true,
    });
    repositoryMocks.getDb.mockReturnValue(harness.db);

    await expect(
      banUser({ userId: "admin-b", actorUserId: "admin-a" }),
    ).rejects.toThrow("Session revocation failed");
    expect(harness.state.get("admin-b")?.accountStatus).toBe("active");
    expect(harness.revokedSessions).toEqual([]);
    expect(repositoryMocks.recordAdminAction).not.toHaveBeenCalled();
  });
});
