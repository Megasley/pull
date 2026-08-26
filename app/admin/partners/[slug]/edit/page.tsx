import Link from "next/link";
import { redirect } from "next/navigation";

import { DeletePartnerOrgButton } from "@/components/admin/partners/delete-partner-org-button";
import { EditPartnerOrgForm } from "@/components/admin/partners/edit-partner-org-form";
import { PageHeader } from "@/components/design-system";
import { Button } from "@/components/ui/button";
import { isAdminRole } from "@/lib/auth/roles";
import { bootstrapCurrentUserProfile } from "@/lib/auth/session";
import { isDatabaseConfigured } from "@/lib/db/env";
import { getPartnerOrgBySlug, listOrgSkills } from "@/lib/partners/orgs";

export const metadata = { title: "Admin · Edit Partner Organization" };

export default async function EditPartnerOrgPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const profile = await bootstrapCurrentUserProfile();
  if (!profile) redirect(`/sign-in?next=/admin/partners/${slug}/edit`);
  if (!isAdminRole(profile.role)) redirect("/admin/partners");

  if (!isDatabaseConfigured()) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 pt-12 pb-20 sm:px-6 lg:px-8">
        <PageHeader eyebrow="admin // partners" title="Database not configured" />
      </div>
    );
  }

  const org = await getPartnerOrgBySlug(slug);
  if (!org) redirect("/admin/partners");

  const skills = await listOrgSkills(org.id);

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pt-12 pb-20 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="admin // partners"
        title={`Edit ${org.name}`}
        actions={
          <Button asChild variant="outline">
            <Link href={`/admin/partners/${slug}`}>Back</Link>
          </Button>
        }
      />

      <EditPartnerOrgForm org={org} skills={skills} />

      <div className="mt-16 border border-destructive/40 p-6">
        <h2 className="font-mono text-xs tracking-wide text-destructive uppercase">
          Danger zone
        </h2>
        <p className="mt-2 max-w-xl font-mono text-xs leading-relaxed text-muted-foreground">
          Deleting this organization removes its invite link, all member records, skills, and
          curated opportunities. This cannot be undone.
        </p>
        <div className="mt-4">
          <DeletePartnerOrgButton orgId={org.id} orgName={org.name} />
        </div>
      </div>
    </div>
  );
}
