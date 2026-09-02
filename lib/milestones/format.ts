/** Minute/hour-granular relative time for the admin notification feed —
 *  e.g. "8 minutes ago", "2 hours ago" — falling back to a date once it's
 *  more than a week old. */
export function formatRelativeTimestamp(iso: string, now: number = Date.now()): string {
  const time = Date.parse(iso);
  if (Number.isNaN(time)) return iso;

  const diffMs = now - time;
  if (diffMs < 0) return "just now";

  const minutes = Math.floor(diffMs / (60 * 1000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;

  return new Date(time).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
