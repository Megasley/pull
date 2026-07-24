import Link from "next/link";

import { DashboardSection } from "@/components/dashboard/dashboard-section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AchievementItem } from "@/types/dashboard";

type SkillsUnlockedSectionProps = {
  skills: string[];
  achievements: AchievementItem[];
};

export function SkillsUnlockedSection({
  skills,
  achievements,
}: SkillsUnlockedSectionProps) {
  const earned = achievements.filter((item) => item.earned).slice(0, 6);

  if (skills.length === 0 && earned.length === 0) {
    return null;
  }

  return (
    <DashboardSection
      id="skills-unlocked"
      title="Skills unlocked"
      description="Portfolio skills and recent achievements."
      action={
        <Button asChild variant="outline" size="sm">
          <Link href="/settings/profile">Edit skills</Link>
        </Button>
      }
    >
      <div className="space-y-4 border border-border bg-card p-4">
        {skills.length > 0 ? (
          <div>
            <p className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">
              Portfolio skills
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {skills.map((skill) => (
                <Badge
                  key={skill}
                  variant="outline"
                  className="border-ink/20 bg-signal/25 text-ink"
                >
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        ) : null}
        {earned.length > 0 ? (
          <div>
            <p className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">
              Achievements earned
            </p>
            <ul className="mt-2 space-y-2">
              {earned.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-2 border-l-2 border-signal pl-3 text-sm"
                >
                  <span>{item.title}</span>
                  {item.xpReward ? (
                    <span className="font-mono text-[11px] text-ink">
                      +{item.xpReward} XP
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
            <p className="mt-3">
              <Link
                href="/achievements"
                className="font-mono text-[11px] underline underline-offset-4"
              >
                View all achievements
              </Link>
            </p>
          </div>
        ) : null}
      </div>
    </DashboardSection>
  );
}
