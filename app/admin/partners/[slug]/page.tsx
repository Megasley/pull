import Link from "next/link";
import { redirect } from "next/navigation";

import { getOrgInviteLinkInfoAction } from "@/app/actions/org-invites";
import { AdminDetailsSection, AdminSection } from "@/components/admin/admin-section";
import { AttentionBanner, type AttentionItem } from "@/components/admin/attention-banner";
import { OrgInviteLinkPanel } from "@/components/admin/partners/org-invite-link-panel";
import { OrgOpportunitiesPanel } from "@/components/admin/partners/org-opportunities-panel";
import { PartnerImpactPanel } from "@/components/admin/partners/partner-impact-panel";
import { PartnerMembersPanel } from "@/components/admin/partners/partner-members-panel";
import { AdminSectionNav } from "@/components/admin/section-nav";
import { PageHeader } from "@/components/design-system";
import { Button } from "@/components/ui/button";
import { isAdminRole } from "@/lib/auth/roles";
import { bootstrapCurrentUserProfile } from "@/lib/auth/session";
import { isDatabaseConfigured } from "@/lib/db/env";
import { getPartnerImpact } from "@/lib/impact/partners";
import { listOrgMembershipsForAdmin } from "@/lib/partners/memberships";
import { listOpportunitiesForOrg } from "@/lib/partners/opportunities";
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

  const [linkInfo, impact, members, opportunities] = await Promise.all([
    getOrgInviteLinkInfoAction(slug),
    getPartnerImpact(org.id),
    listOrgMembershipsForAdmin(org.id),
    listOpportunitiesForOrg(org.id),
  ]);

  const attentionItems: AttentionItem[] = [];
  if (org.status === "inactive") {
    attentionItems.push({ tone: "warning", label: "Organization is inactive" });
  }
  if (!linkInfo.exists && members.length === 0) {
    attentionItems.push({
      tone: "warning",
      label: "No invite link yet",
      detail: "Generate one below so developers can join.",
      href: "#invite-link",
    });
  }
  if (linkInfo.exists && linkInfo.seatCap !== null && linkInfo.seatCount >= linkInfo.seatCap) {
    attentionItems.push({
      tone: "warning",
      label: "Invite link is full",
      detail: `${linkInfo.seatCount}/${linkInfo.seatCap} seats used.`,
      href: "#invite-link",
    });
  }
  if (opportunities.length === 0 && members.length > 0) {
    attentionItems.push({
      tone: "warning",
      label: "No curated opportunities",
      detail: "Members are seeing generic auto-suggested repos instead.",
      href: "#opportunities",
    });
  }

  const navSections = [
    { id: "invite-link", label: "Invite link" },
    { id: "impact", label: "Impact" },
    { id: "opportunities", label: "Opportunities" },
    { id: "members", label: "Members" },
  ];

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

      <AttentionBanner items={attentionItems} />
      <AdminSectionNav sections={navSections} />

      <AdminSection id="invite-link" title="Invite link">
        <OrgInviteLinkPanel
          orgSlug={slug}
          linkExists={linkInfo.exists}
          seatCount={linkInfo.exists ? linkInfo.seatCount : 0}
          seatCap={linkInfo.exists ? linkInfo.seatCap : null}
        />
      </AdminSection>

      <AdminSection id="impact" title="Impact">
        <PartnerImpactPanel impact={impact} />
      </AdminSection>

      <AdminSection id="opportunities" title={`Opportunities (${opportunities.length})`}>
        <OrgOpportunitiesPanel orgSlug={slug} organizationId={org.id} opportunities={opportunities} />
      </AdminSection>

      <AdminDetailsSection id="members" title={`Members (${members.length})`}>
        <PartnerMembersPanel orgSlug={slug} members={members} />
      </AdminDetailsSection>
    </div>
  );
}
