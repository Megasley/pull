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

import { banUser, updateUserRole } from "@/lib/admin/repository";

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

function createDbHarness(targets: string[]) {
  const state = new Map<string, TestUser>([
    ["admin-a", admin("admin-a")],
    ["admin-b", admin("admin-b")],
  ]);
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

      let releaseLock: (() => void) | undefined;
      let executeCalls = 0;
      const transaction = {
        execute: async () => {
          if (executeCalls++ === 0) {
            releaseLock = await acquireLock();
          } else {
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
});
