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
  let timer: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((resolve) => {
        timer = setTimeout(() => {
          if (label) {
            console.warn(`[timeout] ${label} exceeded ${ms}ms`);
          }
          resolve(fallback);
        }, ms);
      }),
    ]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}
