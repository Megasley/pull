import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminDetailsSection, AdminSection } from "@/components/admin/admin-section";
import { AttentionBanner, type AttentionItem } from "@/components/admin/attention-banner";
import {
  AttributionImpactStats,
  ContributorImpactStats,
  GeographyImpactStats,
  RetentionImpactStats,
  type ImpactOverviewData,
} from "@/components/admin/impact-overview-panel";
import { FirstContributionFunnelPanel } from "@/components/admin/first-contribution-funnel-panel";
import { RefreshAdminMetricsButton } from "@/components/admin/refresh-admin-metrics-button";
import { AdminSectionNav } from "@/components/admin/section-nav";
import { EmptyState, PageHeader } from "@/components/design-system";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { FunnelMetrics, LessonDropOff } from "@/lib/admin/analytics";
import { limitConcurrency } from "@/lib/async/limit-concurrency";
import { withTimeoutResult } from "@/lib/async/with-timeout";
import { loadAdminLiveOps, type LiveLoad } from "@/lib/admin/live-ops";
import {
  getAdminMetricsSnapshot,
  type AdminMetricsSnapshotPayload,
  type AdminMetricsSnapshotView,
} from "@/lib/admin/metrics-snapshot";
import type {
  AdminSubmissionRecord,
  CronSyncHealth,
  PlatformMetrics,
} from "@/lib/admin/repository";
import { isAdminRole } from "@/lib/auth/roles";
import { bootstrapCurrentUserProfile } from "@/lib/auth/session";
import { isDatabaseConfigured } from "@/lib/db/env";
import { getFirstContributionFunnel, type FirstContributionFunnel } from "@/lib/first-contribution/funnel";
import {
  countActiveContributors,
  countCountriesAmongContributors,
  countSustainedContributors,
  countTotalMergedPRs,
  countUniqueRepositories,
  countVerifiedAndRepeatContributors,
  getGeographyBreakdown,
  timeToFirstContributionByAttribution,
  timeToFirstMergedPR,
  timeToFirstPR,
} from "@/lib/impact/queries";
import { contributorRetentionForWindows } from "@/lib/impact/retention";
import { getPlatformHealth } from "@/lib/platform/health";
import type { ProjectSubmissionRecord, UserRole } from "@/types/submission";
import { REVIEW_QUEUE_STATUSES, SUBMISSION_STATUS_LABELS } from "@/types/submission";

export const metadata = {
  title: "Admin",
  description: "Platform admin overview for Pull.",
};

export const maxDuration = 30;

/** Budget for DB calls below that must degrade gracefully instead of riding
 *  a hung connection up to this page's own maxDuration — see call sites. */
const ADMIN_QUERY_BUDGET_MS = 8_000;

/** Peak simultaneous connections the impact-overview bundle below is allowed
 *  to hold — it fires ~10 queries (some with their own internal Promise.all)
 *  that would otherwise all open connections at once against a pool sized
 *  for far fewer. See lib/async/limit-concurrency.ts. */
const ADMIN_IMPACT_QUERY_CONCURRENCY = 3;

function snapshotMetaLabel(snapshot: AdminMetricsSnapshotView): string {
  if (snapshot.status === "missing") {
    return "metrics // unavailable — not computed yet";
  }
  const when = snapshot.computedAt
    ? new Date(snapshot.computedAt).toLocaleString()
    : "unknown";
  if (snapshot.status === "error") {
    return `metrics // error · last attempt ${when}`;
  }
  if (snapshot.stale) {
    return `metrics // stale · computed ${when}`;
  }
  return `metrics // computed ${when}`;
}

export default async function AdminOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ funnel?: string }>;
}) {
  const { funnel: funnelRangeParam } = await searchParams;
  const funnelRange = funnelRangeParam === "30d" ? "30d" : "all";
  const profile = await bootstrapCurrentUserProfile();

  if (!profile) {
    redirect("/sign-in?next=/admin");
  }

  if (!isAdminRole(profile.role)) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 pt-12 pb-20 sm:px-6 lg:px-8">
        <PageHeader
          eyebrow="admin // access denied"
          title="Nice try, builder"
          description="This console is for platform admins only. Your badge says builder energy, not root. If you think that’s a bug, it isn’t — but we admire the curiosity."
        />
      </div>
    );
  }

  if (!isDatabaseConfigured()) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 pt-12 pb-20 sm:px-6 lg:px-8">
        <PageHeader
          eyebrow="admin // overview"
          title="Platform admin"
          description="Database is not configured."
        />
      </div>
    );
  }

  // getAdminMetricsSnapshot() has no internal timeout guard (unlike each
  // slice of loadAdminLiveOps, via settleLive). Bound it here so a hung
  // connection degrades this section instead of silently riding the whole
  // request up to maxDuration with no error and no console output.
  const [live, snapshotResult, firstContributionFunnelResult] = await Promise.all([
    loadAdminLiveOps(),
    withTimeoutResult(getAdminMetricsSnapshot(), ADMIN_QUERY_BUDGET_MS, "admin.snapshot"),
    withTimeoutResult(
      getFirstContributionFunnel(),
      ADMIN_QUERY_BUDGET_MS,
      "admin.firstContributionFunnel",
    ),
  ]);
  const snapshot: AdminMetricsSnapshotView = snapshotResult.ok
    ? snapshotResult.value
    : { status: "missing" };
  const firstContributionFunnel: FirstContributionFunnel | null =
    firstContributionFunnelResult.ok ? firstContributionFunnelResult.value : null;

  // Isolated from the two calls above and time-boxed: these are exactly the
  // shape of per-user join that previously timed out inside the
  // admin_metrics_snapshots cron and got disabled (see firstOssViaPull in
  // lib/admin/metrics-snapshot.ts). Running them here, outside that shared
  // transaction, on a single
  // page load — with the same timeout-then-degrade budget loadAdminLiveOps
  // uses for its slices — avoids repeating that failure mode: a slow query
  // against real production data degrades this section instead of riding
  // the request up to the page's own maxDuration.
  let impactOverview: ImpactOverviewData | null = null;
  const impactOverviewResult = await withTimeoutResult(
    (async () => {
      const limit = limitConcurrency(ADMIN_IMPACT_QUERY_CONCURRENCY);
      const [
        verifiedAndRepeat,
        activeContributors,
        sustainedContributors,
        totalMergedPRs,
        uniqueRepositories,
        timeToPr,
        timeToMergedPr,
        geography,
        contributorGeography,
        [retention30, retention90, retention180],
        firstContributionByAttribution,
      ] = await Promise.all([
        limit(() => countVerifiedAndRepeatContributors()),
        limit(() => countActiveContributors()),
        limit(() => countSustainedContributors()),
        limit(() => countTotalMergedPRs()),
        limit(() => countUniqueRepositories()),
        limit(() => timeToFirstPR()),
        limit(() => timeToFirstMergedPR()),
        limit(() => getGeographyBreakdown()),
        limit(() => countCountriesAmongContributors(true)),
        limit(() => contributorRetentionForWindows([30, 90, 180])),
        limit(() => timeToFirstContributionByAttribution()),
      ]);
      const { verified: verifiedContributors, repeat: repeatContributors } = verifiedAndRepeat;

      return {
        verifiedContributors,
        repeatContributors,
        activeContributors,
        sustainedContributors,
        totalMergedPRs,
        uniqueRepositories,
        medianDaysToFirstPR: timeToPr.medianDays,
        medianDaysToFirstMergedPR: timeToMergedPr.medianDays,
        geography,
        contributorCountriesRepresented: contributorGeography.countriesRepresented,
        africanContributorCountriesRepresented: contributorGeography.africanCountriesRepresented,
        retention30,
        retention90,
        retention180,
        firstContributionByAttribution,
      } satisfies ImpactOverviewData;
    })(),
    ADMIN_QUERY_BUDGET_MS,
    "admin.impactOverview",
  );
  if (impactOverviewResult.ok) {
    impactOverview = impactOverviewResult.value;
  }

  const platformHealth = getPlatformHealth();
  const payload: AdminMetricsSnapshotPayload | null =
    snapshot.status === "ok"
      ? snapshot.payload
      : snapshot.status === "error"
        ? snapshot.payload
        : null;

  const metrics: PlatformMetrics | null = payload?.metrics ?? null;
  const funnel: FunnelMetrics | null = payload
    ? funnelRange === "30d"
      ? payload.funnel30d
      : payload.funnelAll
    : null;
  const dropOff: LessonDropOff[] = payload?.dropOff ?? [];
  const roleCounts: Record<UserRole, number> | null = payload?.roleCounts ?? null;
  const userTotal = roleCounts
    ? roleCounts.builder + roleCounts.reviewer + roleCounts.admin
    : null;

  const snapshotUnavailable = !payload;

  const attentionItems: AttentionItem[] = [];
  if (snapshot.status === "missing") {
    attentionItems.push({
      tone: "warning",
      label: "Aggregates unavailable",
      detail: "Launch metrics, funnel, and drop-off haven't been computed yet — use Refresh metrics or wait for the daily cron.",
    });
  } else if (snapshot.status === "error") {
    attentionItems.push({
      tone: "destructive",
      label: "Aggregate refresh failed",
      detail: snapshot.error,
    });
  } else if (snapshot.stale) {
    attentionItems.push({
      tone: "warning",
      label: "Aggregates are stale",
      detail: "Snapshot is older than ~36 hours — cron may be missing CRON_SECRET or failing.",
    });
  }
  if (live.health.status === "ok" && live.health.data.stuckClaims > 0) {
    attentionItems.push({
      tone: "destructive",
      label: `${live.health.data.stuckClaims} stuck claim${live.health.data.stuckClaims === 1 ? "" : "s"}`,
      detail: "Reviewer claimed but expired without a decision.",
      href: "/review?status=stuck",
    });
  }
  if (live.cronHealth.status === "ok" && live.cronHealth.data.errorCount > 0) {
    attentionItems.push({
      tone: "warning",
      label: `${live.cronHealth.data.errorCount} GitHub connection${live.cronHealth.data.errorCount === 1 ? "" : "s"} in error`,
      detail: "See Cron / sync health below.",
      href: "#system",
    });
  }
  // Deliberately NOT flagging platformHealth (missing OAuth/cron secret/etc.)
  // here — those are static config facts, not operational incidents. A
  // config gap doesn't change over time or get "resolved" by looking at
  // this page, so surfacing it as an alert makes the banner permanently red
  // in any environment missing an optional secret (e.g. local dev) and
  // trains the eye to ignore it. It's still visible, correctly framed as
  // status rather than alarm, in the System section's health chips below.

  const navSections = [
    { id: "growth", label: "Growth" },
    { id: "contributors", label: "Contributors" },
    { id: "attribution", label: "Attribution" },
    { id: "geography", label: "Geography" },
    { id: "retention", label: "Retention" },
    { id: "review", label: "Review" },
    { id: "learning", label: "Learning" },
    { id: "first-contribution", label: "First Contribution" },
    { id: "system", label: "System" },
    { id: "users", label: "Users" },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pt-12 pb-20 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="admin // overview"
        title="Platform admin"
        description="Review queue is live. Launch metrics and funnel come from a DB snapshot refreshed daily (or via Refresh metrics)."
        meta={
          userTotal == null
            ? snapshotMetaLabel(snapshot)
            : `users // ${userTotal} · ${snapshotMetaLabel(snapshot)}`
        }
        actions={
          <>
            <RefreshAdminMetricsButton />
            <Button asChild variant="outline">
              <Link href="/admin/activity">./activity</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/admin/users">./users</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/admin/partners">./partners</Link>
            </Button>
            <Button asChild>
              <Link href="/review">./review</Link>
            </Button>
          </>
        }
      />

      <AttentionBanner items={attentionItems} />
      <AdminSectionNav sections={navSections} />

      <AdminSection
        id="growth"
        title="Growth"
        description="From snapshot · MAU = signed-in users with activity in the last 30 days."
      >
        {metrics ? (
          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard label="Registered developers" value={metrics.registeredUsers} />
            <StatCard label="Monthly active users" value={metrics.monthlyActiveUsers} />
            <StatCard label="Projects listed" value={metrics.projectsListed} />
          </div>
        ) : (
          <UnavailableBlock label="Launch metrics" />
        )}
      </AdminSection>

      <AdminSection
        id="contributors"
        title="Contributors"
        description="Computed live from durable contribution history — see docs/metrics-definitions.md."
      >
        {impactOverview ? <ContributorImpactStats data={impactOverview} /> : <UnavailableBlock label="Contributor impact" />}
      </AdminSection>

      <AdminDetailsSection
        id="attribution"
        title="Attribution"
        description="Correlation, not causation — see docs/metrics-definitions.md. Replaces the deprecated single firstOssViaPull number."
      >
        {impactOverview ? <AttributionImpactStats data={impactOverview} /> : <UnavailableBlock label="Attribution" />}
      </AdminDetailsSection>

      <AdminDetailsSection id="geography" title="Geography" description="Country is optional and self-reported.">
        {impactOverview ? <GeographyImpactStats data={impactOverview} /> : <UnavailableBlock label="Geography" />}
      </AdminDetailsSection>

      <AdminDetailsSection id="retention" title="Retention" description="30/90/180-day contributor retention.">
        {impactOverview ? <RetentionImpactStats data={impactOverview} /> : <UnavailableBlock label="Retention" />}
      </AdminDetailsSection>

      <AdminSection id="review" title="Review queue" description="Live · refreshed on each page load">
        {live.health.status === "ok" ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <StatCardLink
                label="Open queue"
                value={live.health.data.openTotal}
                href="/review"
              />
              <StatCardLink
                label="Submitted"
                value={live.health.data.submitted}
                href="/review?status=submitted"
              />
              <StatCardLink
                label="Under review"
                value={live.health.data.underReview}
                href="/review?status=under_review"
              />
              <StatCardLink
                label="Needs changes"
                value={live.health.data.needsChanges}
                href="/review?status=needs_changes"
              />
              <StatCard label="Active claims" value={live.health.data.activeClaims} />
              <StatCardLink
                label="Stuck claims"
                value={live.health.data.stuckClaims}
                href="/review?status=stuck"
                emphasize={live.health.data.stuckClaims > 0}
              />
            </div>
            <OpenQueueBlock openQueue={live.openQueue} />
          </>
        ) : (
          <UnavailableBlock label="Review health" />
        )}

        <div className="mt-8">
          <h3 className="text-sm font-semibold tracking-tight">Recent submissions</h3>
          <p className="mt-1 font-mono text-[11px] text-muted-foreground">
            Live · all statuses, newest first
          </p>
          <RecentSubmissionsBlock load={live.recentSubmissions} />
        </div>
      </AdminSection>

      <AdminDetailsSection
        id="learning"
        title={`Learning funnel (${funnelRange === "30d" ? "30d" : "all-time"})`}
        description="From snapshot · both ranges are computed together each refresh"
      >
        <div className="mb-4 flex gap-2">
          <Button asChild variant={funnelRange === "all" ? "default" : "outline"} size="sm">
            <Link href="/admin">All-time</Link>
          </Button>
          <Button asChild variant={funnelRange === "30d" ? "default" : "outline"} size="sm">
            <Link href="/admin?funnel=30d">30d</Link>
          </Button>
        </div>
        {funnel ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="py-2 pr-4">Stage</th>
                  <th className="py-2">Users</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border/60">
                  <td className="py-2 pr-4">Registered</td>
                  <td className="py-2">{funnel.registeredUsers}</td>
                </tr>
                <tr className="border-b border-border/60">
                  <td className="py-2 pr-4">Completed ≥1 lesson</td>
                  <td className="py-2">{funnel.completedLessonUsers}</td>
                </tr>
                <tr className="border-b border-border/60">
                  <td className="py-2 pr-4">Passed ≥1 chapter quiz</td>
                  <td className="py-2">{funnel.passedQuizUsers}</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Submitted ≥1 project</td>
                  <td className="py-2">{funnel.submittedProjectUsers}</td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <UnavailableBlock label="Learning funnel" />
        )}

        <div className="mt-8">
          <h3 className="text-sm font-semibold tracking-tight">Lesson drop-off</h3>
          <p className="mt-1 font-mono text-[11px] text-muted-foreground">
            From snapshot · lowest completion counts first
          </p>
          {snapshotUnavailable || !payload ? (
            <UnavailableBlock label="Lesson drop-off" />
          ) : dropOff.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">No lesson completions yet.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[560px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="py-2 pr-4">Roadmap</th>
                    <th className="py-2 pr-4">Lesson</th>
                    <th className="py-2 pr-4">Completed</th>
                  </tr>
                </thead>
                <tbody>
                  {dropOff.map((row) => (
                    <tr key={`${row.roadmapSlug}:${row.nodeSlug}`} className="border-b border-border/60">
                      <td className="py-2 pr-4">{row.roadmapSlug}</td>
                      <td className="py-2 pr-4 font-mono text-xs">{row.nodeSlug}</td>
                      <td className="py-2 pr-4">{row.completed}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </AdminDetailsSection>

      <AdminDetailsSection
        id="first-contribution"
        title="First Contribution funnel"
        description="Computed live from milestone_events · where people drop off between starting and their first merged practice PR."
      >
        {firstContributionFunnel ? (
          <FirstContributionFunnelPanel data={firstContributionFunnel} />
        ) : (
          <UnavailableBlock label="First Contribution funnel" />
        )}
      </AdminDetailsSection>

      <AdminDetailsSection id="system" title="System" description="Platform config and background sync health.">
        <div className="flex flex-wrap gap-2">
          <HealthChip label="Database" ok={platformHealth.database} />
          <HealthChip label="Supabase auth" ok={platformHealth.supabaseAuth} />
          <HealthChip label="GitHub OAuth" ok={platformHealth.githubOAuth} />
          <HealthChip label="Resend" ok={platformHealth.resend} />
          <HealthChip label="Cron secret" ok={platformHealth.cronSecret} />
        </div>
        <div className="mt-6">
          <h3 className="text-sm font-semibold tracking-tight">Cron / sync health</h3>
          <CronHealthBlock load={live.cronHealth} />
        </div>
      </AdminDetailsSection>

      <AdminSection
        id="users"
        title="Users"
        description={
          roleCounts
            ? `builders ${roleCounts.builder} · reviewers ${roleCounts.reviewer} · admins ${roleCounts.admin}`
            : "Role counts unavailable — refresh metrics"
        }
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/users">Manage roles</Link>
          </Button>
        }
      >
        <p className="text-sm text-muted-foreground">
          See individual contributor impact — country, PRs, retention status — on each
          user&apos;s detail page.
        </p>
      </AdminSection>
    </div>
  );
}

function UnavailableBlock({ label }: { label: string }) {
  return (
    <div className="mt-4 border border-border bg-muted/30 px-3 py-4">
      <p className="font-mono text-xs text-muted-foreground">
        {label} unavailable · retry with Refresh metrics (or wait for cron)
      </p>
    </div>
  );
}

function OpenQueueBlock({
  openQueue,
}: {
  openQueue: LiveLoad<ProjectSubmissionRecord[]>;
}) {
  if (openQueue.status !== "ok") {
    return <UnavailableBlock label="Open submissions" />;
  }

  if (openQueue.data.length === 0) {
    return (
      <div className="mt-4">
        <EmptyState
          title="Queue is clear"
          description="No open submissions (submitted, in review, or needs changes). Drafts are not counted here — see Recent submissions below."
        />
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-3">
      <h3 className="text-sm font-semibold tracking-tight">Open submissions</h3>
      {openQueue.data.map((item) => (
        <div
          key={item.id}
          className="flex flex-col gap-3 rounded-none border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium">{item.projectTitle}</p>
              <Badge variant="secondary">{SUBMISSION_STATUS_LABELS[item.status]}</Badge>
            </div>
            <p className="font-mono text-[11px] text-muted-foreground">
              {item.builderDisplayName ?? item.builderUsername ?? "Builder"}
              {item.submittedAt
                ? ` · submitted ${new Date(item.submittedAt).toLocaleString()}`
                : ""}
            </p>
          </div>
          <Button asChild size="sm">
            <Link href={`/review/${item.id}`}>./review</Link>
          </Button>
        </div>
      ))}
    </div>
  );
}

function RecentSubmissionsBlock({ load }: { load: LiveLoad<AdminSubmissionRecord[]> }) {
  if (load.status !== "ok") {
    return <UnavailableBlock label="Recent submissions" />;
  }

  if (load.data.length === 0) {
    return <p className="mt-4 text-sm text-muted-foreground">No submissions yet.</p>;
  }

  return (
    <div className="mt-4 space-y-3">
      {load.data.map((item) => (
        <div
          key={item.id}
          className="flex flex-col gap-3 rounded-none border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium">{item.projectTitle}</p>
              <Badge variant="secondary">{SUBMISSION_STATUS_LABELS[item.status]}</Badge>
            </div>
            <p className="font-mono text-[11px] text-muted-foreground">
              {item.builderDisplayName} (@{item.builderUsername})
              {item.submittedAt
                ? ` · submitted ${new Date(item.submittedAt).toLocaleString()}`
                : ` · updated ${new Date(item.updatedAt).toLocaleString()}`}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href={`/admin/users/${item.userId}`}>User</Link>
            </Button>
            {REVIEW_QUEUE_STATUSES.includes(item.status) ? (
              <Button asChild size="sm">
                <Link href={`/review/${item.id}`}>Review</Link>
              </Button>
            ) : (
              <Button asChild size="sm" variant="outline">
                <Link href={`/projects/${item.projectSlug}/submit`}>Submit page</Link>
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function CronHealthBlock({ load }: { load: LiveLoad<CronSyncHealth> }) {
  if (load.status !== "ok") {
    return <UnavailableBlock label="Cron / sync health" />;
  }

  const cronHealth = load.data;
  return (
    <div className="mt-4 space-y-2 text-sm">
      <p>
        Last GitHub sync:{" "}
        {cronHealth.lastSyncedAt
          ? new Date(cronHealth.lastSyncedAt).toLocaleString()
          : "Never"}
      </p>
      <p>Connections in error: {cronHealth.errorCount}</p>
      {cronHealth.recentErrors.length > 0 ? (
        <ul className="space-y-1 font-mono text-xs text-muted-foreground">
          {cronHealth.recentErrors.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function StatCardLink({
  label,
  value,
  href,
  emphasize = false,
}: {
  label: string;
  value: number;
  href: string;
  emphasize?: boolean;
}) {
  return (
    <Link
      href={href}
      className="rounded-none border border-border bg-card p-4 transition-colors hover:bg-muted/40"
    >
      <p className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <div className="mt-2 flex items-center gap-2">
        <p className="text-3xl font-bold tracking-tight">{value}</p>
        {emphasize ? <Badge variant="destructive">attention</Badge> : null}
      </div>
    </Link>
  );
}

function HealthChip({ label, ok }: { label: string; ok: boolean }) {
  return (
    <span
      className={`rounded-none border px-2.5 py-1 text-xs ${
        ok
          ? "border-success/40 bg-success/10 text-success"
          : "border-destructive/40 bg-destructive/10 text-destructive"
      }`}
    >
      {label}: {ok ? "ok" : "missing"}
    </span>
  );
}

function StatCard({
  label,
  value,
  emphasize = false,
}: {
  label: string;
  value: number | null;
  emphasize?: boolean;
}) {
  return (
    <div className="rounded-none border border-border bg-card p-4">
      <p className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <div className="mt-2 flex items-center gap-2">
        <p className="text-3xl font-bold tracking-tight">
          {value == null ? "—" : value}
        </p>
        {emphasize ? <Badge variant="destructive">attention</Badge> : null}
      </div>
    </div>
  );
}
