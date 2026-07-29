import type { BuilderProfile } from "@/types/user";

type AccountStatusBannerProps = {
  profile: BuilderProfile | null;
};

export function AccountStatusBanner({ profile }: AccountStatusBannerProps) {
  if (!profile || profile.accountStatus !== "suspended") {
    return null;
  }

  return (
    <div className="border-b border-amber-500/40 bg-amber-500/10 px-4 py-2.5 text-center text-sm text-amber-950 dark:text-amber-100">
      <p>
        Your account is suspended. You can sign in and view your dashboard, but
        submissions, reviews, and your public profile are disabled.
        {profile.moderationReason ? ` Reason: ${profile.moderationReason}` : ""}
      </p>
    </div>
  );
}
