import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { AdminUserModeration } from "@/components/admin/admin-user-moderation";
import { AdminUserRoleSelect } from "@/components/admin/admin-user-role-select";
import { PageHeader } from "@/components/design-system";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getUserGithubSyncForAdmin,
  getUserSubmissionsForAdmin,
} from "@/lib/admin/analytics";
import { listAuditLogForUser } from "@/lib/admin/audit-log";
import { getAdminUserById } from "@/lib/admin/repository";
import { isUuid } from "@/lib/admin/validate-user-id";
import { isAdminRole } from "@/lib/auth/roles";
import { bootstrapCurrentUserProfile } from "@/lib/auth/session";
import { isDatabaseConfigured } from "@/lib/db/env";
import { buildAllRoadmapProgressSummaries } from "@/lib/progress/summary";
import { getAllCompletedNodeSlugs } from "@/lib/progress/repository";
import { SUBMISSION_STATUS_LABELS } from "@/types/submission";

type AdminUserDetailPageProps = {
  params: Promise<{ id: string }>;
};

export const metadata = {
  title: "Admin · User",
};

export default async function AdminUserDetailPage({
  params,
}: AdminUserDetailPageProps) {
  const profile = await bootstrapCurrentUserProfile();

  if (!profile) {
    redirect("/sign-in?next=/admin/users");
  }

  if (!isAdminRole(profile.role)) {
    notFound();
  }

  const { id } = await params;

  if (!isDatabaseConfigured() || !isUuid(id)) {
    notFound();
  }

  const user = await getAdminUserById(id);

  if (!user) {
    notFound();
  }

  const [progressByRoadmap, submissions, githubSync, auditLog] = await Promise.all([
    getAllCompletedNodeSlugs(user.id),
    getUserSubmissionsForAdmin(user.id),
    getUserGithubSyncForAdmin(user.id),
    listAuditLogForUser(user.id),
  ]);

  const roadmaps = buildAllRoadmapProgressSummaries(progressByRoadmap);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pt-12 pb-20 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="admin // user"
        title={user.displayName}
        description={`@${user.username} · gh:${user.githubUsername}`}
        meta={`id ${user.id} · joined ${new Date(user.createdAt).toLocaleDateString()}`}
        actions={
          <Button asChild variant="outline">
            <Link href="/admin/users">./users</Link>
          </Button>
        }
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-[2fr_1fr]">
        <section className="space-y-6">
          <div className="rounded-none border border-border bg-card p-4">
            <h2 className="text-sm font-semibold">Role</h2>
            <div className="mt-3">
              <AdminUserRoleSelect
                userId={user.id}
                currentRole={user.role}
                isSelf={user.id === profile.id}
              />
            </div>
          </div>

          <AdminUserModeration
            userId={user.id}
            accountStatus={user.accountStatus}
            moderationReason={user.moderationReason}
          />

          <div className="rounded-none border border-border bg-card p-4">
            <h2 className="text-sm font-semibold">Roadmap progress</h2>
            {roadmaps.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">No lesson progress yet.</p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm">
                {roadmaps.map((item) => (
                  <li key={item.roadmapSlug} className="flex justify-between gap-3">
                    <span>{item.title}</span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {item.completed}/{item.total}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-none border border-border bg-card p-4">
            <h2 className="text-sm font-semibold">Recent submissions</h2>
            {submissions.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">No submissions yet.</p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm">
                {submissions.map((item) => (
                  <li key={item.id} className="flex flex-wrap items-center gap-2">
                    <span>{item.projectTitle}</span>
                    <Badge variant="secondary">
                      {SUBMISSION_STATUS_LABELS[item.status]}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <aside className="space-y-6">
          <div className="rounded-none border border-border bg-card p-4">
            <h2 className="text-sm font-semibold">GitHub sync</h2>
            {githubSync ? (
              <dl className="mt-3 space-y-2 text-sm">
                <div>
                  <dt className="text-muted-foreground">Login</dt>
                  <dd>{githubSync.login}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Status</dt>
                  <dd>{githubSync.syncStatus}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Last synced</dt>
                  <dd>
                    {githubSync.lastSyncedAt
                      ? new Date(githubSync.lastSyncedAt).toLocaleString()
                      : "Never"}
                  </dd>
                </div>
                {githubSync.syncError ? (
                  <div>
                    <dt className="text-muted-foreground">Error</dt>
                    <dd className="font-mono text-xs">{githubSync.syncError}</dd>
                  </div>
                ) : null}
              </dl>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">Not connected.</p>
            )}
          </div>

          <div className="rounded-none border border-border bg-card p-4">
            <h2 className="text-sm font-semibold">Audit log</h2>
            {auditLog.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">No admin actions yet.</p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm">
                {auditLog.map((entry) => (
                  <li key={entry.id} className="border-b border-border/60 pb-2">
                    <p className="font-medium">{entry.action}</p>
                    <p className="font-mono text-[11px] text-muted-foreground">
                      {new Date(entry.createdAt).toLocaleString()}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
