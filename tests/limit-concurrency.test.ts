import { describe, expect, it } from "vitest";

import { limitConcurrency } from "@/lib/async/limit-concurrency";

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

describe("limitConcurrency", () => {
  it("never runs more than `limit` calls at once", async () => {
    const limit = limitConcurrency(2);
    let active = 0;
    let maxActive = 0;

    const gates = Array.from({ length: 5 }, () => deferred<void>());

    const runs = gates.map((gate, i) =>
      limit(async () => {
        active++;
        maxActive = Math.max(maxActive, active);
        await gate.promise;
        active--;
        return i;
      }),
    );

    // Let the first wave (limit=2) actually start.
    await Promise.resolve();
    await Promise.resolve();
    expect(active).toBe(2);

    // Release them one at a time — active should never exceed the limit,
    // even as queued calls take freed slots.
    for (const gate of gates) {
      gate.resolve();
      await Promise.resolve();
      await Promise.resolve();
    }

    const results = await Promise.all(runs);
    expect(results).toEqual([0, 1, 2, 3, 4]);
    expect(maxActive).toBeLessThanOrEqual(2);
  });

  it("preserves each call's return type and resolves in call order", async () => {
    const limit = limitConcurrency(3);

    const [a, b, c] = await Promise.all([
      limit(async () => 1),
      limit(async () => "two"),
      limit(async () => ({ three: 3 })),
    ]);

    expect(a).toBe(1);
    expect(b).toBe("two");
    expect(c).toEqual({ three: 3 });
  });

  it("propagates a rejection without blocking other queued calls", async () => {
    const limit = limitConcurrency(1);

    const failing = limit(async () => {
      throw new Error("boom");
    });
    const succeeding = limit(async () => "ok");

    await expect(failing).rejects.toThrow("boom");
    await expect(succeeding).resolves.toBe("ok");
  });
});
