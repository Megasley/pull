import type { BuilderProfile } from "@/types/user";

type AccountStatusBannerProps = {
  profile: BuilderProfile | null;
};

export function AccountStatusBanner({ profile }: AccountStatusBannerProps) {
  if (!profile || profile.accountStatus !== "suspended") {
    return null;
  }

  return (
    <div className="border-b border-warning/40 bg-warning/10 px-4 py-2.5 text-center text-sm text-warning">
      <p>
        Your account is suspended. You can sign in and view your dashboard, but
        submissions, reviews, and your public profile are disabled.
        {profile.moderationReason ? ` Reason: ${profile.moderationReason}` : ""}
      </p>
    </div>
  );
}
