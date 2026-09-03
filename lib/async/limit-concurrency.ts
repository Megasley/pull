/**
 * Returns a `run(fn)` gate that lets at most `limit` wrapped calls execute
 * at once — everything past that queues until a slot frees up. Unlike
 * chunking a Promise.all into sequential batches, this preserves per-call
 * type inference and doesn't force same-size batches to fully finish
 * before the next starts (a slow call doesn't block faster ones behind it
 * from starting as soon as a slot opens).
 *
 * Built for admin dashboard query bundles that otherwise fire ~10 DB calls
 * in one Promise.all against a connection pool sized for far fewer —
 * trading a bit of per-request latency for a much lower peak number of
 * simultaneous connections.
 */
export function limitConcurrency(limit: number) {
  let active = 0;
  const queue: Array<() => void> = [];

  return function run<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const attempt = () => {
        active++;
        fn()
          .then(resolve, reject)
          .finally(() => {
            active--;
            const next = queue.shift();
            if (next) next();
          });
      };

      if (active < limit) {
        attempt();
      } else {
        queue.push(attempt);
      }
    });
  };
}
