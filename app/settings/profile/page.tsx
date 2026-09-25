import { redirect } from "next/navigation";

import { ProfileEditForm } from "@/components/profile/profile-edit-form";
import { PageHeader } from "@/components/design-system";
import { AppearanceSection } from "@/components/settings/appearance-section";
import { bootstrapCurrentUserProfile } from "@/lib/auth/session";
import { listGithubRepositories } from "@/lib/github/store";

export const metadata = {
  title: "Edit portfolio",
  description: "Update your public Pull portfolio.",
};

export default async function ProfileSettingsPage() {
  const profile = await bootstrapCurrentUserProfile();

  if (!profile) {
    redirect("/sign-in?next=/settings/profile");
  }

  // For the "Pin repos" picker — synced data only, same source the public
  // profile itself reads from.
  const syncedRepositories = await listGithubRepositories(profile.id, { limit: 30 });

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pt-12 pb-20 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="settings // portfolio"
        title="Edit portfolio"
        description={`These details appear on your public builder portfolio at /u/${profile.username}.`}
      />

      <div className="mt-10 space-y-6">
        <AppearanceSection />
        <div className="rounded-none border border-border bg-card p-5 sm:p-6">
          <ProfileEditForm profile={profile} syncedRepositories={syncedRepositories} />
        </div>
      </div>
    </div>
  );
}
