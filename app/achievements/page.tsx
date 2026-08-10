import { redirect } from "next/navigation";

import { AchievementGallery } from "@/components/achievements/achievement-gallery";
import { AchievementUnlockToast } from "@/components/achievements/achievement-unlock-toast";
import { PageHeader } from "@/components/design-system";
import { bootstrapCurrentUserProfile } from "@/lib/auth/session";
import { getAllCompletedNodeSlugs } from "@/lib/progress/repository";
import { listUserAchievements, syncAchievementsForUser } from "@/lib/xp/achievements";

export const metadata = {
  title: "Achievements",
  description: "Track Pull milestones and unlocked achievements.",
};

export default async function AchievementsPage() {
  const profile = await bootstrapCurrentUserProfile();

  if (!profile) {
    redirect("/sign-in?next=/achievements");
  }

  await syncAchievementsForUser(profile.id);
  const progressByRoadmap = await getAllCompletedNodeSlugs(profile.id);
  const achievements = await listUserAchievements(profile.id, progressByRoadmap);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pt-12 pb-20 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="progress // achievements"
        title="Achievements"
        description="Celebrate meaningful progress - lessons, projects, Lightning, and open source contributions."
        meta={`catalog // ${achievements.length}`}
      />

      <div className="mt-10">
        <AchievementGallery achievements={achievements} />
      </div>
      <AchievementUnlockToast achievements={achievements} />
    </div>
  );
}
