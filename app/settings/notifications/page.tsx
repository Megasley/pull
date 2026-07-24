import { redirect } from "next/navigation";

import { NotificationSettingsForm } from "@/components/settings/notification-settings-form";
import { PageHeader } from "@/components/design-system";
import { bootstrapCurrentUserProfile } from "@/lib/auth/session";

export const metadata = {
  title: "Notifications",
  description: "Choose which Pull emails you receive.",
};

export default async function NotificationSettingsPage() {
  const profile = await bootstrapCurrentUserProfile();

  if (!profile) {
    redirect("/sign-in?next=/settings/notifications");
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pt-12 pb-20 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="settings // notifications"
        title="Email notifications"
        description="Transactional emails for reviews, achievements, and account changes. Defaults are on until you opt out."
      />

      <div className="mt-10 rounded-none border border-border bg-card p-5 sm:p-6">
        <NotificationSettingsForm
          email={profile.email}
          prefs={profile.emailNotifications}
        />
      </div>
    </div>
  );
}
