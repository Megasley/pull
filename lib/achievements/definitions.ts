import type { AchievementCategory, AchievementCriteria } from "@/types/achievement";

export type AchievementDefinition = {
  id: string;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
  category: AchievementCategory;
  criteria: AchievementCriteria;
};

/**
 * Catalog of achievements. Add new entries here - evaluator + DB seed pick them up.
 */
export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  {
    id: "first-lesson",
    title: "First Lesson",
    description: "Complete your first Pull lesson.",
    icon: "🎯",
    xpReward: 25,
    category: "learning",
    criteria: { type: "lessons_completed", min: 1 },
  },
  {
    id: "bitcoin-foundations",
    title: "Bitcoin Foundations",
    description: "Finish every lesson in the Bitcoin Foundations section.",
    icon: "🧱",
    xpReward: 50,
    category: "learning",
    criteria: {
      type: "nodes_complete",
      roadmap: "bitcoin",
      nodeIds: [
        "foundations-intro",
        "foundations-git",
        "foundations-crypto",
        "foundations-economics",
      ],
    },
  },
  {
    id: "bitcoin-quarter",
    title: "Bitcoin Apprentice",
    description: "Reach 25% completion on the Bitcoin roadmap.",
    icon: "₿",
    xpReward: 40,
    category: "learning",
    criteria: { type: "roadmap_progress", roadmap: "bitcoin", percent: 25 },
  },
  {
    id: "bitcoin-half",
    title: "Protocol Explorer",
    description: "Reach 50% completion on the Bitcoin roadmap.",
    icon: "⛓️",
    xpReward: 60,
    category: "learning",
    criteria: { type: "roadmap_progress", roadmap: "bitcoin", percent: 50 },
  },
  {
    id: "first-project",
    title: "First Project",
    description: "Complete your first build project node on any roadmap.",
    icon: "🔨",
    xpReward: 75,
    category: "projects",
    criteria: { type: "any_project_node" },
  },
  {
    id: "wallet-builder",
    title: "Wallet Builder",
    description: "Complete the Mini Wallet project on the Bitcoin roadmap.",
    icon: "👛",
    xpReward: 100,
    category: "projects",
    criteria: { type: "project_slug_complete", projectSlug: "mini-wallet" },
  },
  {
    id: "lightning-builder",
    title: "Lightning Builder",
    description: "Complete a Lightning project node (POS, dashboard, or router).",
    icon: "⚡",
    xpReward: 120,
    category: "projects",
    criteria: {
      type: "nodes_complete_any",
      roadmap: "lightning",
      nodeIds: ["ln-project-pos", "ln-project-dashboard", "ln-project-router"],
    },
  },
  {
    id: "lightning-unlocked",
    title: "Layer Two Ready",
    description: "Unlock the Lightning roadmap by finishing Bitcoin.",
    icon: "🔓",
    xpReward: 100,
    category: "milestones",
    criteria: { type: "roadmap_unlocked", roadmap: "lightning" },
  },
  {
    id: "open-source-contributor",
    title: "Open Source Contributor",
    description: "Get a project submission approved by a reviewer.",
    icon: "🌐",
    xpReward: 150,
    category: "open-source",
    criteria: { type: "submissions_approved", min: 1 },
  },
  {
    id: "oss-ready",
    title: "Open Source Ready",
    description: "Reach the Open Source section on the Bitcoin roadmap.",
    icon: "🗺️",
    xpReward: 80,
    category: "open-source",
    criteria: {
      type: "nodes_complete_any",
      roadmap: "bitcoin",
      nodeIds: [
        "oss-discovery",
        "oss-review",
        "oss-maintainer",
        "oss-portfolio",
      ],
    },
  },
  {
    id: "roadmap-complete",
    title: "Roadmap Complete",
    description: "Finish every node on any published roadmap.",
    icon: "🏁",
    xpReward: 200,
    category: "milestones",
    criteria: { type: "any_roadmap_complete" },
  },
];

export const ACHIEVEMENT_CATEGORY_LABELS: Record<AchievementCategory, string> = {
  learning: "Learning",
  projects: "Projects",
  "open-source": "Open source",
  milestones: "Milestones",
};
