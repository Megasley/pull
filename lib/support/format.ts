const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

export function formatSats(amount: number): string {
  return `${new Intl.NumberFormat("en-US").format(Math.floor(amount))} sats`;
}

export function formatDonationRelative(iso: string): string {
  const time = Date.parse(iso);
  if (!Number.isFinite(time)) return "";

  const delta = Date.now() - time;
  if (delta < 0) return "Just now";
  if (delta < MINUTE_MS) return "Just now";
  if (delta < HOUR_MS) {
    const minutes = Math.floor(delta / MINUTE_MS);
    return minutes === 1 ? "1 minute ago" : `${minutes} minutes ago`;
  }
  if (delta < DAY_MS) {
    const hours = Math.floor(delta / HOUR_MS);
    return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
  }
  if (delta < 2 * DAY_MS) return "Yesterday";
  if (delta < 30 * DAY_MS) {
    const days = Math.floor(delta / DAY_MS);
    return `${days} days ago`;
  }
  return new Date(time).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
