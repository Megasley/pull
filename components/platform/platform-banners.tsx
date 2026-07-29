import { bootstrapCurrentUserProfile } from "@/lib/auth/session";

import { AccountStatusBanner } from "./account-status-banner";
import { PlatformStatusBanner } from "./platform-status-banner";

export async function PlatformBanners() {
  const profile = await bootstrapCurrentUserProfile();

  return (
    <>
      <PlatformStatusBanner />
      <AccountStatusBanner profile={profile} />
    </>
  );
}
