import { getPlatformHealth } from "@/lib/platform/health";

export function PlatformStatusBanner() {
  const health = getPlatformHealth();

  if (health.database) {
    return null;
  }

  return (
    <div className="border-b border-destructive/30 bg-destructive/10 px-4 py-2.5 text-center text-sm text-destructive">
      <p>Database is not configured — progress and submissions may not save.</p>
    </div>
  );
}
