import Link from "next/link";
import { redirect } from "next/navigation";

import { getOrgInviteLinkInfoAction } from "@/app/actions/org-invites";
import { OrgInviteLinkPanel } from "@/components/admin/partners/org-invite-link-panel";
import { PageHeader } from "@/components/design-system";
import { Button } from "@/components/ui/button";
import { isAdminRole } from "@/lib/auth/roles";
import { bootstrapCurrentUserProfile } from "@/lib/auth/session";
import { isDatabaseConfigured } from "@/lib/db/env";
import { getPartnerOrgBySlug } from "@/lib/partners/orgs";

export const metadata = { title: "Admin · Partner Organization" };

export default async function AdminPartnerOrgPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const profile = await bootstrapCurrentUserProfile();
  if (!profile) redirect(`/sign-in?next=/admin/partners/${slug}`);
  if (!isAdminRole(profile.role)) redirect("/admin/partners");

  if (!isDatabaseConfigured()) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 pt-12 pb-20 sm:px-6 lg:px-8">
        <PageHeader eyebrow="admin // partners" title="Database not configured" />
      </div>
    );
  }

  const org = await getPartnerOrgBySlug(slug);
  if (!org) redirect("/admin/partners");

  const linkInfo = await getOrgInviteLinkInfoAction(slug);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pt-12 pb-20 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="admin // partners"
        title={org.name}
        description={org.description || undefined}
        meta={`${org.type} · ${org.status}`}
        actions={
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/admin/partners">All Partners</Link>
            </Button>
            <Button asChild>
              <Link href={`/admin/partners/${slug}/edit`}>Edit</Link>
            </Button>
          </div>
        }
      />

      {org.website && (
        <p className="mt-4 font-mono text-xs text-muted-foreground">
          <a
            href={org.website}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2"
          >
            {org.website}
          </a>
        </p>
      )}

      <div className="mt-12">
        <OrgInviteLinkPanel
          orgSlug={slug}
          linkExists={linkInfo.exists}
          seatCount={linkInfo.exists ? linkInfo.seatCount : 0}
          seatCap={linkInfo.exists ? linkInfo.seatCap : null}
        />
      </div>
    </div>
  );
}
