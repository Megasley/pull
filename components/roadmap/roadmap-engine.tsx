"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Check, Lock } from "lucide-react";

import { useAuthSession } from "@/hooks/use-auth-session";
import { useRoadmapProgress, useRoadmapUnlocked } from "@/hooks/use-roadmap-progress";
import {
  calculateRoadmapProgress,
  resolveNodeStatuses,
} from "@/lib/roadmap/progress";
import { getRoadmapFromRegistry } from "@/lib/roadmap/prerequisites";
import { cn } from "@/lib/utils";
import type { RoadmapJson, RoadmapJsonNode } from "@/types/roadmap";
import type { RoadmapNodeStatus } from "@/types";

import { RoadmapLegend } from "./roadmap-legend";
import { RoadmapLockedBanner } from "./roadmap-locked-banner";
import { RoadmapProgressBar } from "./roadmap-progress-bar";

import "@/styles/roadmap-map.css";

type RoadmapEngineProps = {
  data: RoadmapJson;
  className?: string;
};

function TopicChip({
  node,
  status,
  roadmapSlug,
  enforceLocks,
}: {
  node: RoadmapJsonNode;
  status: RoadmapNodeStatus;
  roadmapSlug: string;
  enforceLocks: boolean;
}) {
  const locked = enforceLocks && status === "locked";
  const href = `/roadmaps/${roadmapSlug}/lessons/${node.id}`;

  const content = (
    <>
      <span
        className={cn(
          "flex size-4 shrink-0 items-center justify-center rounded-none border",
          status === "completed" && "border-ink bg-signal text-ink",
          status === "active" && "border-ink bg-ink text-[var(--background)]",
          status === "default" && "border-border bg-transparent text-muted-foreground",
          locked && "border-border bg-muted/40 text-muted-foreground",
        )}
      >
        {status === "completed" ? (
          <Check className="size-2.5" aria-hidden />
        ) : locked ? (
          <Lock className="size-2.5" aria-hidden />
        ) : (
          <span className="size-1 bg-current opacity-70" aria-hidden />
        )}
      </span>
      <span className="min-w-0 flex-1 whitespace-normal break-words font-mono text-[11px] leading-snug tracking-wide sm:truncate sm:leading-normal">
        {node.title}
      </span>
    </>
  );

  const className = cn(
    "flex w-full items-center gap-2 rounded-none border px-3 py-2.5 text-left transition-colors",
    status === "completed" && "border-ink/25 bg-signal/20 hover:bg-signal/30",
    status === "active" && "border-ink bg-ink/5 hover:bg-ink/10",
    status === "default" &&
      "border-border bg-transparent hover:border-ink/40 hover:bg-muted/40",
    locked && "cursor-not-allowed border-border bg-muted/20 opacity-70",
  );

  if (locked) {
    return (
      <div className={className} aria-disabled title={node.description}>
        {content}
      </div>
    );
  }

  return (
    <Link href={href} className={className} title={node.description}>
      {content}
    </Link>
  );
}

export function RoadmapEngine({ data, className }: RoadmapEngineProps) {
  const { isAuthenticated } = useAuthSession();
  const { completedIds } = useRoadmapProgress(data.id, data);
  const roadmapUnlocked = useRoadmapUnlocked(data);
  const freeBrowse = !isAuthenticated;
  const roadmapLocked =
    !freeBrowse && Boolean(data.prerequisiteRoadmap && !roadmapUnlocked);

  const statuses = useMemo(
    () =>
      resolveNodeStatuses(data.nodes, completedIds, {
        roadmapLocked,
        freeBrowse,
      }),
    [data.nodes, completedIds, roadmapLocked, freeBrowse],
  );

  const progress = useMemo(
    () => calculateRoadmapProgress(data.nodes, completedIds),
    [data.nodes, completedIds],
  );

  const prerequisite = data.prerequisiteRoadmap
    ? getRoadmapFromRegistry(data.prerequisiteRoadmap.slug)
    : null;

  const prerequisiteTitle =
    prerequisite?.title ?? data.prerequisiteRoadmap?.slug ?? "";

  return (
    <div className={cn("roadmap-map", className)}>
      {data.prerequisiteRoadmap ? (
        <RoadmapLockedBanner
          tone={freeBrowse ? "info" : roadmapLocked ? "locked" : "info"}
          message={
            freeBrowse
              ? `Suggested path: finish ${prerequisiteTitle} first. All lessons stay readable without an account — sign in to track progress.`
              : roadmapLocked
                ? (data.prerequisiteRoadmap.message ??
                  `Complete the ${prerequisiteTitle} roadmap to unlock this path.`)
                : `Built on ${prerequisiteTitle}.`
          }
          prerequisiteSlug={data.prerequisiteRoadmap.slug}
          prerequisiteTitle={prerequisiteTitle}
        />
      ) : null}

      <div className="mb-8 flex flex-col gap-3 border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
        <RoadmapProgressBar progress={progress} className="min-w-0 flex-1" />
        <RoadmapLegend />
      </div>

      <ol className="roadmap-spine">
        {data.sections.map((section, sectionIndex) => {
          const side = sectionIndex % 2 === 0 ? "right" : "left";
          const sectionNodes = data.nodes.filter(
            (node) => node.sectionId === section.id,
          );
          const isLast = sectionIndex === data.sections.length - 1;

          return (
            <li
              key={section.id}
              className={cn("roadmap-spine-block", `roadmap-spine-block--${side}`)}
            >
              {!isLast ? <div className="roadmap-spine-connector" aria-hidden /> : null}

              <div className="roadmap-spine-grid">
                <div className="roadmap-branch roadmap-branch--left">
                  {side === "left" ? (
                    <div className="roadmap-topic-group">
                      {sectionNodes.map((node) => (
                        <TopicChip
                          key={node.id}
                          node={node}
                          status={statuses.get(node.id) ?? "default"}
                          roadmapSlug={data.id}
                          enforceLocks={!freeBrowse}
                        />
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="roadmap-milestone-col">
                  <div className="roadmap-milestone" title={section.description}>
                    {section.title}
                  </div>
                </div>

                <div className="roadmap-branch roadmap-branch--right">
                  {side === "right" ? (
                    <div className="roadmap-topic-group">
                      {sectionNodes.map((node) => (
                        <TopicChip
                          key={node.id}
                          node={node}
                          status={statuses.get(node.id) ?? "default"}
                          roadmapSlug={data.id}
                          enforceLocks={!freeBrowse}
                        />
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      <p className="mt-8 font-mono text-[11px] tracking-wide text-muted-foreground">
        {freeBrowse
          ? "public read // sign in to save progress and unlock gated sequences"
          : roadmapLocked
            ? "progress saved // unlock prerequisite to continue"
            : "signal milestones mark each section // topic chips open lessons"}
      </p>
    </div>
  );
}
