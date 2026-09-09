import type { FirstContributionFunnel } from "@/lib/first-contribution/funnel";

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

function formatPct(value: number | null): string {
  return value === null ? "—" : `${value}%`;
}

function formatDays(value: number | null): string {
  return value === null ? "—" : `${value.toFixed(1)}d`;
}

/** Computed live from milestone_events — cheap indexed counts/joins, unlike
 *  the snapshot-backed Learning funnel above it — see
 *  lib/first-contribution/funnel.ts. */
export function FirstContributionFunnelPanel({ data }: { data: FirstContributionFunnel }) {
  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="py-2 pr-4">Stage</th>
              <th className="py-2">Users</th>
            </tr>
          </thead>
          <tbody>
            {data.stages.map((stage, index) => (
              <tr
                key={stage.type}
                className={index < data.stages.length - 1 ? "border-b border-border/60" : ""}
              >
                <td className="py-2 pr-4">{stage.label}</td>
                <td className="py-2">{stage.users}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Started → PR opened"
          value={formatPct(data.conversion.startedToPrOpened)}
        />
        <Stat
          label="PR opened → PR merged"
          value={formatPct(data.conversion.prOpenedToPrMerged)}
        />
        <Stat
          label="Median time to PR"
          value={formatDays(data.timeToPrOpened.medianDays)}
          hint={
            data.timeToPrOpened.pending > 0
              ? `${data.timeToPrOpened.pending} started, no PR yet`
              : undefined
          }
        />
        <Stat
          label="Median time PR → merge"
          value={formatDays(data.timeToPrMerged.medianDays)}
          hint={
            data.timeToPrMerged.pending > 0
              ? `${data.timeToPrMerged.pending} opened, not merged yet`
              : undefined
          }
        />
      </div>

      <div className="mt-6 border border-border bg-muted/30 px-3 py-4">
        <p className="font-mono text-xs text-muted-foreground">
          Completed → Real project click: not available here. That click is tracked as a
          client-side Vercel Analytics custom event (first_real_project_clicked) — Vercel
          Web Analytics has no API this app can query, so it can&apos;t be joined into this
          funnel. Check the Vercel Analytics dashboard for that event directly.
        </p>
      </div>
    </div>
  );
}
