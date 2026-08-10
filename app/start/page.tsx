import { redirect } from "next/navigation";

import { bootstrapCurrentUserProfile } from "@/lib/auth/session";

export const metadata = {
  title: "Start Building",
};

export default async function StartPage() {
  const profile = await bootstrapCurrentUserProfile();

  if (!profile) {
    redirect("/sign-in?next=/start");
  }

  if (!profile.onboardingCompletedAt) {
    redirect("/onboarding");
  }

  redirect(
    profile.preferredRoadmapSlug
      ? `/roadmaps/${profile.preferredRoadmapSlug}`
      : "/roadmaps",
  );
}
