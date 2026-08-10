export const DEVELOPER_TOOL_CATEGORIES = [
  "APIs",
  "SDKs",
  "Infrastructure",
  "Open Source",
  "Wallets",
  "Protocols",
] as const;

export type DeveloperToolCategory =
  (typeof DEVELOPER_TOOL_CATEGORIES)[number];

export const DEVELOPER_TOOL_DIFFICULTIES = [
  "Beginner",
  "Intermediate",
  "Advanced",
] as const;

export type DeveloperToolDifficulty =
  (typeof DEVELOPER_TOOL_DIFFICULTIES)[number];

export type DeveloperToolProjectIdea = {
  title: string;
  description: string;
  href?: string;
};

export type DeveloperToolLearningPath = {
  title: string;
  href: string;
};

export type DeveloperTool = {
  id: string;
  slug: string;
  name: string;
  description: string;
  overview: string;
  whyUse: string[];
  /** Concise card line, e.g. "Lightning Wallets". */
  buildUseCase: string;
  category: DeveloperToolCategory;
  tags: string[];
  openSource: boolean;
  difficulty: DeveloperToolDifficulty;
  website: string;
  docs: string;
  github?: string;
  /** Initials or short mark used when no image asset exists. */
  logo: string;
  /** Boosted in the main directory sort. */
  featured: boolean;
  /** Subtle Sponsored badge. */
  sponsored: boolean;
  /** Shown in the Featured Partners strip (easy to manage for sponsors). */
  featuredPartner: boolean;
  /** Analytics foundation — increment later from click handlers. */
  clicks: number;
  websiteClicks: number;
  docsClicks: number;
  learningPaths: DeveloperToolLearningPath[];
  projectIdeas: DeveloperToolProjectIdea[];
  tutorials?: { title: string; href: string }[];
};

export type DeveloperToolFilter = DeveloperToolCategory | "All";

export type DeveloperToolsPageStats = {
  toolsLabel: string;
  categoriesLabel: string;
  cadenceLabel: string;
};
