import { CollapsibleCard } from "@/components/admin/collapsible-card";
import { getCountryInfo } from "@/lib/geo/countries";
import type { UserImpactSummary } from "@/lib/impact/user-detail";

function formatDays(days: number | null): string {
  return days === null ? "—" : `${days}d`;
}

function formatDate(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString() : "—";
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

/**
 * The individual-level view of the same durable contribution history behind
 * the aggregate admin panels (components/admin/impact-overview-panel.tsx,
 * components/admin/partners/partner-impact-panel.tsx). "Qualifying" excludes
 * merges into the user's own repos — see docs/metrics-definitions.md.
 */
export function UserImpactPanel({ impact }: { impact: UserImpactSummary }) {
  const countryName = getCountryInfo(impact.country)?.name;

  return (
    <div className="space-y-6">
      <div className="rounded-none border border-border bg-card p-4">
        <h2 className="text-sm font-semibold">Impact</h2>
        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3">
          <Fact label="Country" value={countryName ?? "Not provided"} />
          <Fact label="Acquisition source" value={impact.acquisitionSource ?? "Unknown (pre-tracking)"} />
          <Fact label="GitHub" value={impact.githubLogin ? `@${impact.githubLogin}` : "Not connected"} />
          <Fact label="Total PRs" value={String(impact.totalPRs)} />
          <Fact label="Qualifying merged PRs" value={String(impact.qualifyingMergedPRs)} />
          <Fact label="Unique repositories" value={String(impact.uniqueRepositories)} />
          <Fact label="First PR" value={formatDate(impact.firstPRDate)} />
          <Fact label="First merged PR" value={formatDate(impact.firstMergedPRDate)} />
          <Fact label="Last contribution" value={formatDate(impact.lastContributionAt)} />
          <Fact label="Days to first PR" value={formatDays(impact.daysToFirstPR)} />
          <Fact label="Days to first merge" value={formatDays(impact.daysToFirstMergedPR)} />
        </dl>
        <div className="mt-4 flex flex-wrap gap-1.5 font-mono text-[10px] uppercase tracking-wide">
          {impact.isVerifiedContributor ? (
            <span className="border border-border px-2 py-1">verified contributor</span>
          ) : null}
          {impact.isRepeatContributor ? (
            <span className="border border-border px-2 py-1">repeat contributor</span>
          ) : null}
          {impact.isActiveContributor ? (
            <span className="border border-border px-2 py-1">active (90d)</span>
          ) : null}
          {impact.isSustainedContributor ? (
            <span className="border border-border px-2 py-1">sustained (3+ months)</span>
          ) : null}
          {!impact.isVerifiedContributor ? (
            <span className="text-muted-foreground">No qualifying contributions yet.</span>
          ) : null}
        </div>
      </div>

      {impact.memberships.length > 0 ? (
        <div className="rounded-none border border-border bg-card p-4">
          <h2 className="text-sm font-semibold">Partner / program memberships</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {impact.memberships.map((m) => (
              <li key={m.organizationId} className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2">
                <span>
                  {m.organizationName}{" "}
                  <span className="font-mono text-[11px] text-muted-foreground">
                    joined {formatDate(m.joinedAt)} · {m.qualificationStatus}
                  </span>
                </span>
                <span className="font-mono text-[11px] text-muted-foreground">
                  {m.attributedPRs} PR{m.attributedPRs === 1 ? "" : "s"} · {m.attributedMergedPRs} merged
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {impact.recentPullRequests.length > 0 ? (
        <CollapsibleCard title={`Pull requests (${impact.recentPullRequests.length})`}>
          <ul className="space-y-2 text-sm">
            {impact.recentPullRequests.map((pr) => (
              <li key={pr.id} className="border-b border-border/60 pb-2">
                <a
                  href={pr.htmlUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="underline-offset-2 hover:underline"
                >
                  {pr.repoFullName}#{pr.number}
                </a>{" "}
                <span className="font-mono text-[11px] text-muted-foreground">
                  {pr.merged ? "merged" : pr.draft ? "draft" : pr.state}
                  {pr.isOwnRepo ? " · own repo" : ""}
                  {pr.isPracticeRepo ? " · practice repo" : ""}
                  {pr.attributedPartnerName ? ` · via ${pr.attributedPartnerName}` : ""}
                  {pr.attributedViaOpportunity ? " · via tracked opportunity" : ""}
                </span>
              </li>
            ))}
          </ul>
        </CollapsibleCard>
      ) : null}

      {impact.recentOpportunityEvents.length > 0 ? (
        <CollapsibleCard title="Recent opportunity activity">
          <ul className="space-y-2 text-sm">
            {impact.recentOpportunityEvents.map((event, i) => (
              <li key={i} className="flex flex-wrap justify-between gap-2 font-mono text-[11px] text-muted-foreground">
                <span>
                  {event.eventType} · {event.repoFullName ?? event.opportunityKey}
                </span>
                <span>{formatDate(event.createdAt)}</span>
              </li>
            ))}
          </ul>
        </CollapsibleCard>
      ) : null}
    </div>
  );
}
