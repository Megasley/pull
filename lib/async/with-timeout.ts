/**
 * Resolve with `fallback` if `promise` does not settle within `ms`.
 * Does not cancel the underlying work — use with DB statement_timeout too.
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  fallback: T,
  label?: string,
): Promise<T> {
  const result = await withTimeoutResult(promise, ms, label);
  return result.ok ? result.value : fallback;
}

/** Like `withTimeout`, but distinguishes timeout / rejection from a real value. */
export async function withTimeoutResult<T>(
  promise: Promise<T>,
  ms: number,
  label?: string,
): Promise<{ ok: true; value: T } | { ok: false; reason: "timeout" | "error" }> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  try {
    return await new Promise((resolve) => {
      timer = setTimeout(() => {
        if (label) {
          console.warn(`[timeout] ${label} exceeded ${ms}ms`);
        }
        resolve({ ok: false, reason: "timeout" });
      }, ms);

      promise
        .then((value) => resolve({ ok: true, value }))
        .catch((error) => {
          if (label) {
            console.warn(`[timeout] ${label} rejected`, error);
          }
          resolve({ ok: false, reason: "error" });
        });
    });
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}
