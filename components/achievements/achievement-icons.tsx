import type { ComponentType, SVGProps } from "react";
import {
  Bitcoin,
  Blocks,
  Flag,
  Globe,
  GitMerge,
  GitPullRequest,
  Hammer,
  Link2,
  Map,
  Target,
  Unlock,
  Wallet,
  Zap,
} from "lucide-react";

import type { AchievementIconKey } from "@/types/achievement";

export const ACHIEVEMENT_ICONS: Record<
  AchievementIconKey,
  ComponentType<SVGProps<SVGSVGElement>>
> = {
  target: Target,
  blocks: Blocks,
  bitcoin: Bitcoin,
  link: Link2,
  hammer: Hammer,
  wallet: Wallet,
  zap: Zap,
  unlock: Unlock,
  globe: Globe,
  map: Map,
  flag: Flag,
  "git-pull-request": GitPullRequest,
  "git-merge": GitMerge,
};
