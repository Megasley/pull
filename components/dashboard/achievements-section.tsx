import { AchievementGallery } from "@/components/achievements/achievement-gallery";
import { AchievementUnlockToast } from "@/components/achievements/achievement-unlock-toast";
import { DashboardSection } from "@/components/dashboard/dashboard-section";
import { Button } from "@/components/ui/button";
import type { AchievementItem } from "@/types/dashboard";
import Link from "next/link";

type AchievementsSectionProps = {
  achievements: AchievementItem[];
};

export function AchievementsSection({ achievements }: AchievementsSectionProps) {
  const earnedCount = achievements.filter((item) => item.earned).length;
  const preview = [...achievements]
    .sort((a, b) => Number(b.earned) - Number(a.earned))
    .slice(0, 4);

  return (
    <>
      <DashboardSection
        id="achievements"
        title="Achievements"
        description={
          earnedCount > 0
            ? `${earnedCount} of ${achievements.length} unlocked`
            : "Complete lessons and projects to unlock milestones."
        }
        action={
          <Button asChild variant="outline" size="sm">
            <Link href="/achievements">View all</Link>
          </Button>
        }
      >
        <AchievementGallery achievements={preview} showFilters={false} />
      </DashboardSection>
      <AchievementUnlockToast achievements={achievements} />
    </>
  );
}
