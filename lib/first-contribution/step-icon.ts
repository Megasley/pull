import type { ComponentType, SVGProps } from "react";
import {
  BookOpen,
  Code2,
  FolderTree,
  GitFork,
  GitMerge,
  GitPullRequest,
  MessageSquare,
  Rocket,
  Search,
  Wrench,
} from "lucide-react";

/**
 * Icon keyed by name, not by component reference: `firstContributionSteps`
 * (lib/first-contribution/steps.ts) is read by both a server component
 * (journey-overview.tsx) and a client component (first-contribution-step.tsx,
 * "use client"). A component *reference* isn't serializable across that
 * server-to-client prop boundary — passing one crashes with "Functions
 * cannot be passed directly to Client Components" — so the step data only
 * ever carries this string key, and each consumer resolves the actual icon
 * locally via this map.
 */
export type FirstContributionStepIconName =
  | "book-open"
  | "wrench"
  | "folder-tree"
  | "search"
  | "git-fork"
  | "code"
  | "git-pull-request"
  | "message-square"
  | "git-merge"
  | "rocket";

export const STEP_ICONS: Record<
  FirstContributionStepIconName,
  ComponentType<SVGProps<SVGSVGElement>>
> = {
  "book-open": BookOpen,
  wrench: Wrench,
  "folder-tree": FolderTree,
  search: Search,
  "git-fork": GitFork,
  code: Code2,
  "git-pull-request": GitPullRequest,
  "message-square": MessageSquare,
  "git-merge": GitMerge,
  rocket: Rocket,
};
