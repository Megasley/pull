import { XP_PER_LEVEL } from "@/lib/xp/config";
import type { BuilderLevelInfo } from "@/types/dashboard";

export function levelFromXp(xp: number): number {
  return Math.floor(Math.max(0, xp) / XP_PER_LEVEL) + 1;
}

export function buildLevelInfo(xp: number, level?: number): BuilderLevelInfo {
  const safeXp = Math.max(0, xp);
  const xpIntoLevel = safeXp % XP_PER_LEVEL;
  const progressPercentage = Math.round((xpIntoLevel / XP_PER_LEVEL) * 100);

  return {
    level: level ?? levelFromXp(safeXp),
    xp: safeXp,
    xpIntoLevel,
    xpForNextLevel: XP_PER_LEVEL,
    progressPercentage,
  };
}
