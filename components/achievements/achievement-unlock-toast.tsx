"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";

import {
  readMigratedSessionStorage,
  writePullSessionStorage,
} from "@/lib/storage/brand-keys";
import type { AchievementItem } from "@/types/dashboard";

type AchievementUnlockToastProps = {
  achievements: AchievementItem[];
};

const SEEN_SUFFIX = "seen-achievement-unlocks";

function readSeen(): string[] {
  try {
    const raw = readMigratedSessionStorage(SEEN_SUFFIX);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

function writeSeen(ids: string[]) {
  writePullSessionStorage(SEEN_SUFFIX, JSON.stringify([...new Set(ids)]));
}

export function AchievementUnlockToast({ achievements }: AchievementUnlockToastProps) {
  const recent = useMemo(
    () => achievements.filter((item) => item.earned && item.recentlyUnlocked),
    [achievements],
  );

  const [seen, setSeen] = useState<string[]>(() => readSeen());
  const [queue, setQueue] = useState<AchievementItem[]>([]);
  const [queuedKey, setQueuedKey] = useState("");

  const seenSet = useMemo(() => new Set(seen), [seen]);
  const fresh = recent.filter((item) => !seenSet.has(item.id));
  const freshKey = fresh.map((item) => item.id).join("\0");

  // Enqueue newly unlocked achievements during render (React-approved pattern).
  if (fresh.length > 0 && freshKey !== queuedKey) {
    const nextSeen = [...seen, ...fresh.map((item) => item.id)];
    writeSeen(nextSeen);
    setSeen(nextSeen);
    setQueuedKey(freshKey);
    setQueue(fresh);
  }

  const current = queue[0];

  if (!current) {
    return null;
  }

  return (
    <div
      className="fixed right-4 bottom-4 z-50 w-[min(100%-2rem,22rem)] animate-fade-in-up"
      role="status"
      aria-live="polite"
    >
      <div className="overflow-hidden rounded-none border border-primary/30 bg-card p-4">
        <div className="flex items-start gap-3">
          <div className="flex size-11 items-center justify-center rounded-none border border-primary/30 bg-primary/10 text-xl achievement-unlock-icon">
            {current.icon}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium uppercase tracking-wide text-primary">
              Achievement unlocked
            </p>
            <p className="mt-0.5 font-medium text-foreground">{current.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{current.description}</p>
            {current.xpReward ? (
              <p className="mt-2 font-mono text-xs text-muted-foreground">
                +{current.xpReward} XP
              </p>
            ) : null}
          </div>
          <button
            type="button"
            className="rounded-md p-1 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            aria-label="Dismiss"
            onClick={() => setQueue((items) => items.slice(1))}
          >
            <X className="size-4" />
          </button>
        </div>
        {queue.length > 1 ? (
          <p className="mt-3 text-xs text-muted-foreground">
            +{queue.length - 1} more unlocked
          </p>
        ) : null}
      </div>
    </div>
  );
}
