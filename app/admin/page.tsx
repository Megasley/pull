import Link from "next/link";
import { redirect } from "next/navigation";

import { EmptyState, PageHeader } from "@/components/design-system";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  countUsersByRole,
  getCronSyncHealth,
  getPlatformMetrics,
  getReviewHealth,
  listRecentSubmissionsForAdmin,
} from "@/lib/admin/repository";
import {
  getLearningFunnel,
  getLessonDropOff,
} from "@/lib/admin/analytics";
import { filterDemoSubmissions } from "@/lib/admin/metrics-queries";
import { isAdminRole } from "@/lib/auth/roles";
import { bootstrapCurrentUserProfile } from "@/lib/auth/session";
import { isDatabaseConfigured } from "@/lib/db/env";
import { getPlatformHealth } from "@/lib/platform/health";
import { listReviewQueue } from "@/lib/reviews/repository";
import { REVIEW_QUEUE_STATUSES, SUBMISSION_STATUS_LABELS } from "@/types/submission";

export const metadata = {
  title: "Admin",
  description: "Platform admin overview for Pull.",
};

/** Allow longer runs on Pro; Hobby still caps lower. */
export const maxDuration = 30;

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

  const [health, roleCounts, metrics, cronHealth, funnel, dropOff] =
    await Promise.all([
      getReviewHealth(),
      countUsersByRole(),
      getPlatformMetrics(),
      getCronSyncHealth(),
      getLearningFunnel(funnelRange),
      getLessonDropOff(10),
    ]);

  const platformHealth = getPlatformHealth();

  const openQueue = filterDemoSubmissions(
    await listReviewQueue(profile.id),
  );
  const recentSubmissions = await listRecentSubmissionsForAdmin(25);

  const userTotal =
    roleCounts.builder + roleCounts.reviewer + roleCounts.admin;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pt-12 pb-20 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="admin // overview"
        title="Platform admin"
        description="Launch metrics, users, and review queue health. Role changes happen on the users page."
        meta={`users // ${userTotal}`}
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/admin/users">./users</Link>
            </Button>
            <Button asChild>
              <Link href="/review">./review</Link>
            </Button>
          </>
        }
      />

      <section className="mt-10">
        <h2 className="text-lg font-semibold tracking-tight">Launch metrics</h2>
        <p className="mt-1 max-w-2xl font-mono text-[11px] text-muted-foreground">
          MAU = signed-in users with activity in the last 30 days. First OSS via
          Pull is deferred so this page cannot hang production.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Registered developers"
            value={metrics.registeredUsers}
          />
          <StatCard
            label="Monthly active users"
            value={metrics.monthlyActiveUsers}
          />
          <StatCard label="Projects listed" value={metrics.projectsListed} />
          <StatCard
            label="First OSS via Pull"
            value={metrics.firstOssViaPull}
          />
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-lg font-semibold tracking-tight">Review health</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <StatCardLink label="Open queue" value={health.openTotal} href="/review" />
          <StatCardLink label="Submitted" value={health.submitted} href="/review?status=submitted" />
          <StatCardLink
            label="Under review"
            value={health.underReview}
            href="/review?status=under_review"
          />
          <StatCardLink
            label="Needs changes"
            value={health.needsChanges}
            href="/review?status=needs_changes"
          />
          <StatCard label="Active claims" value={health.activeClaims} />
          <StatCardLink
            label="Stuck claims"
            value={health.stuckClaims}
            href="/review?status=stuck"
            emphasize={health.stuckClaims > 0}
          />
        </div>
        {openQueue.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              title="Queue is clear"
              description="No open submissions (submitted, in review, or needs changes). Drafts are not counted here — see Recent submissions below."
            />
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            <h3 className="text-sm font-semibold tracking-tight">
              Open submissions
            </h3>
            {openQueue.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-3 rounded-none border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{item.projectTitle}</p>
                    <Badge variant="secondary">
                      {SUBMISSION_STATUS_LABELS[item.status]}
                    </Badge>
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
        )}
      </section>

      <section className="mt-12">
        <h2 className="text-lg font-semibold tracking-tight">Recent submissions</h2>
        <p className="mt-1 font-mono text-[11px] text-muted-foreground">
          All statuses, newest first — includes drafts that were saved but not
          submitted for review.
        </p>
        {recentSubmissions.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">No submissions yet.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {recentSubmissions.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-3 rounded-none border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{item.projectTitle}</p>
                    <Badge variant="secondary">
                      {SUBMISSION_STATUS_LABELS[item.status]}
                    </Badge>
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
                      <Link href={`/projects/${item.projectSlug}/submit`}>
                        Submit page
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-12">
        <h2 className="text-lg font-semibold tracking-tight">Platform config</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          <HealthChip label="Database" ok={platformHealth.database} />
          <HealthChip label="Supabase auth" ok={platformHealth.supabaseAuth} />
          <HealthChip label="GitHub OAuth" ok={platformHealth.githubOAuth} />
          <HealthChip label="Resend" ok={platformHealth.resend} />
          <HealthChip label="Cron secret" ok={platformHealth.cronSecret} />
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-lg font-semibold tracking-tight">Cron / sync health</h2>
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
      </section>

      <section className="mt-12">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              Learning funnel ({funnelRange === "30d" ? "30d" : "all-time"})
            </h2>
            <p className="mt-1 font-mono text-[11px] text-muted-foreground">
              {funnelRange === "30d"
                ? "Counts signups and activity in the last 30 days only."
                : "Counts all users and activity since launch."}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              asChild
              variant={funnelRange === "all" ? "default" : "outline"}
              size="sm"
            >
              <Link href="/admin">All-time</Link>
            </Button>
            <Button
              asChild
              variant={funnelRange === "30d" ? "default" : "outline"}
              size="sm"
            >
              <Link href="/admin?funnel=30d">30d</Link>
            </Button>
          </div>
        </div>
        <div className="mt-4 overflow-x-auto">
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
              <tr className="border-b border-border/60">
                <td className="py-2 pr-4">Submitted ≥1 project</td>
                <td className="py-2">{funnel.submittedProjectUsers}</td>
              </tr>
              <tr>
                <td className="py-2 pr-4">First OSS via Pull</td>
                <td className="py-2">{funnel.firstOssViaPull}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-lg font-semibold tracking-tight">Lesson drop-off</h2>
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
                <tr
                  key={`${row.roadmapSlug}:${row.nodeSlug}`}
                  className="border-b border-border/60"
                >
                  <td className="py-2 pr-4">{row.roadmapSlug}</td>
                  <td className="py-2 pr-4 font-mono text-xs">{row.nodeSlug}</td>
                  <td className="py-2 pr-4">{row.completed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-12">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Users</h2>
            <p className="mt-1 font-mono text-[11px] text-muted-foreground">
              builders {roleCounts.builder} · reviewers {roleCounts.reviewer} ·
              admins {roleCounts.admin}
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/users">Manage roles</Link>
          </Button>
        </div>
      </section>
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
          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200"
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
  value: number;
  emphasize?: boolean;
}) {
  return (
    <div className="rounded-none border border-border bg-card p-4">
      <p className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <div className="mt-2 flex items-center gap-2">
        <p className="text-3xl font-bold tracking-tight">{value}</p>
        {emphasize ? <Badge variant="destructive">attention</Badge> : null}
      </div>
    </div>
  );
}
