import { redirect } from "next/navigation";

import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { bootstrapCurrentUserProfile } from "@/lib/auth/session";
import { isDatabaseConfigured } from "@/lib/db/env";
import { getGithubConnectionPublic } from "@/lib/github";

export const metadata = {
  title: "Onboarding",
  description: "Set up your Pull builder profile.",
};

export default async function OnboardingPage() {
  const profile = await bootstrapCurrentUserProfile();

  if (!profile) {
    redirect("/sign-in?next=/onboarding");
  }

  if (profile.onboardingCompletedAt) {
    redirect(
      profile.preferredRoadmapSlug
        ? `/roadmaps/${profile.preferredRoadmapSlug}`
        : "/dashboard",
    );
  }

  const githubConnected =
    isDatabaseConfigured() && Boolean(await getGithubConnectionPublic(profile.id));

  return <OnboardingWizard githubConnected={githubConnected} />;
}
