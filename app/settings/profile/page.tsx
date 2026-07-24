import { redirect } from "next/navigation";

import { ProfileEditForm } from "@/components/profile/profile-edit-form";
import { PageHeader } from "@/components/design-system";
import { bootstrapCurrentUserProfile } from "@/lib/auth/session";

export const metadata = {
  title: "Edit portfolio",
  description: "Update your public Pull portfolio.",
};

export default async function ProfileSettingsPage() {
  const profile = await bootstrapCurrentUserProfile();

  if (!profile) {
    redirect("/sign-in?next=/settings/profile");
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pt-12 pb-20 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="settings // portfolio"
        title="Edit portfolio"
        description={`These details appear on your public builder portfolio at /u/${profile.username}.`}
      />

      <div className="mt-10 rounded-none border border-border bg-card p-5 sm:p-6">
        <ProfileEditForm profile={profile} />
      </div>
    </div>
  );
}
