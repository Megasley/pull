import { describe, expect, it } from "vitest";

import {
  applyNodeCompletionSnapshot,
  ProgressMutationCoordinator,
  reconcileProgressSnapshot,
  type ProgressScope,
} from "@/lib/progress/pending-mutations";

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

const scope: ProgressScope = {
  userId: "builder-id",
  roadmapSlug: "bitcoin",
};

describe("roadmap progress hydration", () => {
  it("preserves only an in-flight completion over stale hydration, then reconciles", async () => {
    const coordinator = new ProgressMutationCoordinator();
    const mutation = coordinator.begin(scope, "foundations-intro", true, false);

    const staleServer = deferred<Iterable<string> | null>();
    const hydration = reconcileProgressSnapshot(
      coordinator,
      scope,
      () => staleServer.promise,
    );

    staleServer.resolve([]);
    await expect(hydration).resolves.toEqual(new Set(["foundations-intro"]));

    expect(coordinator.settle(scope, "foundations-intro", mutation.token)).toEqual(
      mutation,
    );

    await expect(
      reconcileProgressSnapshot(coordinator, scope, async () => ["foundations-intro"]),
    ).resolves.toEqual(new Set(["foundations-intro"]));
    expect(coordinator.overlay(scope, [])).toEqual(new Set());
  });

  it("ignores an older hydration after post-mutation reconciliation starts", async () => {
    const coordinator = new ProgressMutationCoordinator();
    const mutation = coordinator.begin(scope, "foundations-intro", true, false);
    const staleServer = deferred<Iterable<string> | null>();
    const staleHydration = reconcileProgressSnapshot(
      coordinator,
      scope,
      () => staleServer.promise,
    );

    coordinator.settle(scope, "foundations-intro", mutation.token);
    await expect(
      reconcileProgressSnapshot(coordinator, scope, async () => ["foundations-intro"]),
    ).resolves.toEqual(new Set(["foundations-intro"]));

    staleServer.resolve([]);
    await expect(staleHydration).resolves.toBeNull();
  });

  it("rolls back only the failed node while preserving other and newer state", async () => {
    const coordinator = new ProgressMutationCoordinator();
    const failed = coordinator.begin(scope, "foundations-intro", true, false);
    coordinator.begin(scope, "dev-regtest", true, false);

    await expect(
      reconcileProgressSnapshot(coordinator, scope, async () => []),
    ).resolves.toEqual(new Set(["foundations-intro", "dev-regtest"]));

    const settled = coordinator.settle(scope, "foundations-intro", failed.token);
    expect(settled).toEqual(failed);

    const cached = new Set(["existing-node", "foundations-intro", "dev-regtest"]);
    const rolledBack = applyNodeCompletionSnapshot(
      cached,
      "foundations-intro",
      settled!.previousCompleted,
    );

    expect(coordinator.overlay(scope, rolledBack)).toEqual(
      new Set(["existing-node", "dev-regtest"]),
    );
  });

  it("does not let an older mutation settle a newer mutation for the same node", () => {
    const coordinator = new ProgressMutationCoordinator();
    const first = coordinator.begin(scope, "foundations-intro", true, false);
    const second = coordinator.begin(scope, "foundations-intro", false, true);

    expect(coordinator.settle(scope, "foundations-intro", first.token)).toBeNull();
    expect(coordinator.overlay(scope, ["foundations-intro"])).toEqual(new Set());
    expect(coordinator.settle(scope, "foundations-intro", second.token)).toEqual(
      second,
    );
  });
});
