import Link from "next/link";
import { redirect } from "next/navigation";

import { EmptyState, PageHeader } from "@/components/design-system";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  countUsersByRole,
  getPlatformMetrics,
  getReviewHealth,
} from "@/lib/admin/repository";
import { withTimeout } from "@/lib/async/with-timeout";
import { isAdminRole } from "@/lib/auth/roles";
import { bootstrapCurrentUserProfile } from "@/lib/auth/session";
import { isDatabaseConfigured } from "@/lib/db/env";

export const metadata = {
  title: "Admin",
  description: "Platform admin overview for Pull.",
};

/** Allow longer runs on Pro; Hobby still caps lower. */
export const maxDuration = 30;

export default async function AdminOverviewPage() {
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

  const emptyHealth = {
    submitted: 0,
    underReview: 0,
    needsChanges: 0,
    openTotal: 0,
    activeClaims: 0,
    stuckClaims: 0,
  };
  const emptyRoles = { builder: 0, reviewer: 0, admin: 0 };
  const emptyMetrics = {
    registeredUsers: 0,
    monthlyActiveUsers: 0,
    projectsListed: 0,
    firstOssViaPull: 0,
  };

  // Hard ceiling so a stuck DB connection cannot burn the whole invocation.
  const [health, roleCounts, metrics] = await withTimeout(
    Promise.all([
      getReviewHealth(),
      countUsersByRole(),
      getPlatformMetrics(),
    ]),
    7_000,
    [emptyHealth, emptyRoles, emptyMetrics],
    "admin.overview",
  );

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
          <StatCard label="Open queue" value={health.openTotal} />
          <StatCard label="Submitted" value={health.submitted} />
          <StatCard label="Under review" value={health.underReview} />
          <StatCard label="Needs changes" value={health.needsChanges} />
          <StatCard label="Active claims" value={health.activeClaims} />
          <StatCard
            label="Stuck claims"
            value={health.stuckClaims}
            emphasize={health.stuckClaims > 0}
          />
        </div>
        {health.openTotal === 0 ? (
          <div className="mt-4">
            <EmptyState
              title="Queue is clear"
              description="No open submissions need attention."
            />
          </div>
        ) : null}
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
