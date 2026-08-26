import { redirect } from "next/navigation";

import { NewPartnerOrgForm } from "@/components/admin/partners/new-partner-org-form";
import { PageHeader } from "@/components/design-system";
import { isAdminRole } from "@/lib/auth/roles";
import { bootstrapCurrentUserProfile } from "@/lib/auth/session";

export const metadata = { title: "Admin · New Partner Organization" };

export default async function NewPartnerOrgPage() {
  const profile = await bootstrapCurrentUserProfile();
  if (!profile) redirect("/sign-in?next=/admin/partners/new");
  if (!isAdminRole(profile.role)) redirect("/admin/partners");

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pt-12 pb-20 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="admin // partners"
        title="New Organization"
        description="Create a partner organization. A shared invite link can be generated after."
      />

      <NewPartnerOrgForm />
    </div>
  );
}
