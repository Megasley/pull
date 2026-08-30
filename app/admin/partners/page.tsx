import Link from "next/link";
import { redirect } from "next/navigation";

import { EmptyState, PageHeader } from "@/components/design-system";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { isAdminRole } from "@/lib/auth/roles";
import { bootstrapCurrentUserProfile } from "@/lib/auth/session";
import { isDatabaseConfigured } from "@/lib/db/env";
import { listPartnerOrgs } from "@/lib/partners/orgs";

export const metadata = { title: "Admin · Partners" };

export default async function AdminPartnersPage() {
  const profile = await bootstrapCurrentUserProfile();
  if (!profile) redirect("/sign-in?next=/admin/partners");
  if (!isAdminRole(profile.role)) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 pt-12 pb-20 sm:px-6 lg:px-8">
        <PageHeader eyebrow="admin // access denied" title="Nice try, builder" />
      </div>
    );
  }

  const orgs = isDatabaseConfigured() ? await listPartnerOrgs() : [];

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pt-12 pb-20 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="admin // partners"
        title="Partner Organizations"
        description="Manage learning partners and their shared invite links."
        meta={`${orgs.length} organization${orgs.length !== 1 ? "s" : ""}`}
        actions={
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/admin">./admin</Link>
            </Button>
            <Button asChild>
              <Link href="/admin/partners/new">New Organization</Link>
            </Button>
          </div>
        }
      />

      {orgs.length === 0 ? (
        <EmptyState
          className="mt-10"
          title="No partner organizations yet"
          description="Create your first partner organization to generate a shared invite link."
          actionLabel="New Organization"
          actionHref="/admin/partners/new"
        />
      ) : (
        <div className="mt-10 divide-y divide-border border border-border">
          {orgs.map((org) => (
            <Link
              key={org.id}
              href={`/admin/partners/${org.slug}`}
              className="flex items-center justify-between px-6 py-5 transition-colors hover:bg-muted/30"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-semibold">{org.name}</span>
                  <Badge variant={org.status === "active" ? "default" : "secondary"}>
                    {org.status}
                  </Badge>
                </div>
                <p className="mt-1 font-mono text-xs text-muted-foreground">
                  /{org.slug} · {org.memberCount} member{org.memberCount !== 1 ? "s" : ""}
                </p>
              </div>
              <span className="ml-4 shrink-0 font-mono text-xs text-muted-foreground">→</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
