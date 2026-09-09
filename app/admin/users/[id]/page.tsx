import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { AdminUserDangerZone } from "@/components/admin/admin-user-danger-zone";
import { AdminUserModeration } from "@/components/admin/admin-user-moderation";
import { AdminUserRoleSelect } from "@/components/admin/admin-user-role-select";
import { AttentionBanner, type AttentionItem } from "@/components/admin/attention-banner";
import { CollapsibleCard } from "@/components/admin/collapsible-card";
import { AdminSectionNav } from "@/components/admin/section-nav";
import { UserImpactPanel } from "@/components/admin/user-impact-panel";
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
import { getUserImpactSummary } from "@/lib/impact/user-detail";
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

  const [progressByRoadmap, submissions, githubSync, auditLog, impact] = await Promise.all([
    getAllCompletedNodeSlugs(user.id),
    getUserSubmissionsForAdmin(user.id),
    getUserGithubSyncForAdmin(user.id),
    listAuditLogForUser(user.id),
    getUserImpactSummary(user.id),
  ]);

  const roadmaps = buildAllRoadmapProgressSummaries(progressByRoadmap);

  const attentionItems: AttentionItem[] = [];
  if (user.accountStatus !== "active") {
    attentionItems.push({
      tone: "destructive",
      label: `Account ${user.accountStatus}`,
      detail: user.moderationReason ?? undefined,
      href: "#role",
    });
  }
  if (githubSync?.syncError) {
    attentionItems.push({
      tone: "warning",
      label: "GitHub sync error",
      detail: githubSync.syncError,
      href: "#system",
    });
  }

  const navSections = [
    { id: "role", label: "Role & moderation" },
    { id: "impact", label: "Impact" },
    { id: "learning", label: "Learning" },
    { id: "system", label: "System" },
    { id: "danger", label: "Danger zone" },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pt-12 pb-20 sm:px-6 lg:px-8">
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

      <AttentionBanner items={attentionItems} />
      <AdminSectionNav sections={navSections} />

      <div className="mt-8 grid gap-6 lg:grid-cols-[2fr_1fr]">
        <section className="space-y-6">
          <div id="role" className="scroll-mt-16 rounded-none border border-border bg-card p-4">
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

          {impact ? (
            <div id="impact" className="scroll-mt-16 space-y-6">
              <UserImpactPanel impact={impact} />
            </div>
          ) : null}

          <div id="learning" className="scroll-mt-16 rounded-none border border-border bg-card p-4">
            <h2 className="text-sm font-semibold">Roadmap progress</h2>
            {roadmaps.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">
                No lesson progress yet.
              </p>
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

          <div id="danger" className="scroll-mt-16">
            <AdminUserDangerZone
              userId={user.id}
              username={user.username}
              isSelf={user.id === profile.id}
            />
          </div>
        </section>

        <aside id="system" className="scroll-mt-16 space-y-6">
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

          <CollapsibleCard title={`Audit log (${auditLog.length})`}>
            {auditLog.length === 0 ? (
              <p className="text-sm text-muted-foreground">No admin actions yet.</p>
            ) : (
              <ul className="space-y-2 text-sm">
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
          </CollapsibleCard>
        </aside>
      </div>
    </div>
  );
}
