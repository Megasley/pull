import type { PartnerImpact } from "@/lib/impact/partners";

type Props = {
  impact: PartnerImpact;
};

function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="border border-border bg-transparent px-3 py-2.5">
      <dt className="font-mono text-[10px] tracking-wide text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className="mt-1 text-lg font-semibold tabular-nums">{value}</dd>
      {hint ? <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="font-mono text-[10px] tracking-wide text-muted-foreground uppercase">
        {title}
      </h3>
      <dl className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">{children}</dl>
    </div>
  );
}

function formatDays(days: number | null): string {
  return days === null ? "—" : `${days.toFixed(1)}d`;
}

/**
 * Partner-scoped impact, computed from durable contribution history — see
 * lib/impact/partners.ts. Every number here follows the attribution rule
 * documented there (membership at time of contribution, set once, never
 * causal) — this panel is deliberately plain rather than decorative so that
 * rule stays visible rather than getting lost behind a chart.
 */
export function PartnerImpactPanel({ impact }: Props) {
  return (
    <div className="space-y-6">
      <p className="max-w-2xl font-mono text-xs leading-relaxed text-muted-foreground">
        Attributed to this partner when a member had an active membership here at the time a PR
        was opened. This is a correlation, not proof this partner caused the contribution — see
        docs/metrics-definitions.md.
      </p>

      <Group title="Reach">
        <Stat label="Seats used" value={impact.developersInvited} hint="via shared invite link" />
        <Stat label="Developers joined" value={impact.developersJoined} />
        <Stat label="GitHub connected" value={impact.githubConnected} />
        <Stat label="Explored an opportunity" value={impact.opportunitiesExplored} />
        <Stat
          label="External program qualified"
          value={impact.qualifiedMemberCount}
          hint="qualified / completed / graduated"
        />
      </Group>

      <Group title="Contribution outcomes">
        <Stat label="Verified contributors" value={impact.verifiedContributors} hint="≥1 qualifying merged PR" />
        <Stat label="Repeat contributors" value={impact.repeatContributors} hint="≥2 qualifying merged PRs" />
        <Stat label="Active contributors" value={impact.activeContributors} hint="last 90 days" />
        <Stat label="Sustained contributors" value={impact.sustainedContributors} hint="≥3 distinct months" />
        <Stat label="Total PRs" value={impact.totalPRs} />
        <Stat label="Total merged PRs" value={impact.totalMergedPRs} />
        <Stat label="Repos contributed to" value={impact.projectsContributedTo} />
        <Stat label="Countries represented" value={impact.countriesRepresented} />
      </Group>

      <Group title="Time to contribution">
        <Stat
          label="Median time to first PR"
          value={formatDays(impact.medianDaysToFirstPR)}
          hint={`${impact.timeToFirstPR.completed} reached, ${impact.timeToFirstPR.pending} pending`}
        />
        <Stat
          label="Median time to first merge"
          value={formatDays(impact.medianDaysToFirstMergedPR)}
          hint={`${impact.timeToFirstMergedPR.completed} reached, ${impact.timeToFirstMergedPR.pending} pending`}
        />
      </Group>
    </div>
  );
}
