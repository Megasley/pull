import { Text } from "@react-email/components";

import { EmailLayout } from "@/lib/email/templates/layout";

type AchievementEmailProps = {
  displayName: string;
  achievements: { title: string; xpReward: number }[];
  href: string;
};

export function AchievementEmail({
  displayName,
  achievements,
  href,
}: AchievementEmailProps) {
  const preview =
    achievements.length === 1
      ? `Achievement unlocked: ${achievements[0].title}`
      : `${achievements.length} achievements unlocked`;

  return (
    <EmailLayout
      preview={preview}
      title={
        achievements.length === 1 ? "Achievement unlocked" : "Achievements unlocked"
      }
      ctaLabel="View achievements"
      ctaHref={href}
    >
      <Text style={{ margin: "0 0 12px" }}>Hey {displayName},</Text>
      <Text style={{ margin: "0 0 12px" }}>You just unlocked:</Text>
      {achievements.map((item) => (
        <Text key={item.title} style={{ margin: "0 0 8px" }}>
          • <strong>{item.title}</strong>
          {item.xpReward > 0 ? ` (+${item.xpReward} XP)` : ""}
        </Text>
      ))}
    </EmailLayout>
  );
}
