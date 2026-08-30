import type { GeographyBreakdown } from "@/lib/impact/queries";
import type { RetentionResult } from "@/lib/impact/retention";

export type ImpactOverviewData = {
  verifiedContributors: number;
  repeatContributors: number;
  activeContributors: number;
  sustainedContributors: number;
  totalMergedPRs: number;
  uniqueRepositories: number;
  medianDaysToFirstPR: number | null;
  medianDaysToFirstMergedPR: number | null;
  geography: GeographyBreakdown;
  contributorCountriesRepresented: number;
  africanContributorCountriesRepresented: number;
  retention30: RetentionResult;
  retention90: RetentionResult;
  retention180: RetentionResult;
};

function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-none border border-border bg-card p-4">
      <p className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
      {hint ? <p className="mt-1 font-mono text-[10px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function formatDays(days: number | null): string {
  return days === null ? "—" : `${days.toFixed(1)}d`;
}

function formatRate(result: RetentionResult): string {
  return result.rate === null ? "—" : `${Math.round(result.rate * 100)}%`;
}

/**
 * Computed live from durable contribution history (lib/impact/*) rather than
 * the daily admin_metrics_snapshots cron — see the "First OSS via Pull" stat
 * in the Growth section, which is still intentionally disabled for exactly
 * the reason this runs on-demand here instead of inside that cron.
 * "Qualifying" excludes merges into a contributor's own repos — see
 * docs/metrics-definitions.md.
 */
export function ContributorImpactStats({ data }: { data: ImpactOverviewData }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Stat label="Verified contributors" value={data.verifiedContributors} hint="≥1 qualifying merged PR" />
      <Stat label="Repeat contributors" value={data.repeatContributors} hint="≥2 qualifying merged PRs" />
      <Stat label="Active contributors" value={data.activeContributors} hint="opened/merged in last 90 days" />
      <Stat label="Sustained contributors" value={data.sustainedContributors} hint="≥3 distinct months" />
      <Stat label="Total merged PRs" value={data.totalMergedPRs} />
      <Stat label="Unique repositories" value={data.uniqueRepositories} />
      <Stat label="Median time to first PR" value={formatDays(data.medianDaysToFirstPR)} />
      <Stat label="Median time to first merge" value={formatDays(data.medianDaysToFirstMergedPR)} />
    </div>
  );
}

export function GeographyImpactStats({ data }: { data: ImpactOverviewData }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Stat
        label="Countries represented"
        value={data.geography.countriesRepresented}
        hint={`${data.geography.usersWithKnownCountry} of ${data.geography.totalUsers} users reported one`}
      />
      <Stat label="African countries" value={data.geography.africanCountriesRepresented} />
      <Stat
        label="Countries among contributors"
        value={data.contributorCountriesRepresented}
        hint="users with a qualifying merged PR"
      />
      <Stat
        label="African countries among contributors"
        value={data.africanContributorCountriesRepresented}
      />
    </div>
  );
}

export function RetentionImpactStats({ data }: { data: ImpactOverviewData }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <Stat
        label="30-day retention"
        value={formatRate(data.retention30)}
        hint={`${data.retention30.retainedCount} / ${data.retention30.cohortSize} eligible`}
      />
      <Stat
        label="90-day retention"
        value={formatRate(data.retention90)}
        hint={`${data.retention90.retainedCount} / ${data.retention90.cohortSize} eligible`}
      />
      <Stat
        label="180-day retention"
        value={formatRate(data.retention180)}
        hint={`${data.retention180.retainedCount} / ${data.retention180.cohortSize} eligible`}
      />
    </div>
  );
}
