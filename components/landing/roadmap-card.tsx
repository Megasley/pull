"use client";

import Link from "next/link";
import { ArrowRight, Clock, FolderKanban, Lock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRoadmapProgress } from "@/hooks/use-roadmap-progress";
import type { LandingRoadmap } from "@/lib/landing-data";
import { calculateRoadmapProgress } from "@/lib/roadmap/progress";
import { getRoadmapFromRegistry } from "@/lib/roadmap/prerequisites";
import { cn } from "@/lib/utils";
import type { RoadmapDifficulty } from "@/types";
import type { RoadmapJson } from "@/types/roadmap";

const difficultyLabels: Record<RoadmapDifficulty, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

const EMPTY_ROADMAP: RoadmapJson = {
  id: "",
  title: "",
  sections: [],
  nodes: [],
  edges: [],
};

type RoadmapCardProps = {
  roadmap: LandingRoadmap;
  index?: number;
  className?: string;
};

function roadmapCtaLabel(completed: number, total: number): string {
  if (completed <= 0) return "./start-roadmap";
  if (total > 0 && completed >= total) return "./review-roadmap";
  return "./continue-roadmap";
}

export function RoadmapCard({ roadmap, className }: RoadmapCardProps) {
  const isComingSoon = roadmap.status === "coming-soon";
  const isLocked = Boolean(roadmap.prerequisite);
  const registryRoadmap = getRoadmapFromRegistry(roadmap.slug);
  const { completedIds } = useRoadmapProgress(
    roadmap.slug,
    registryRoadmap ?? EMPTY_ROADMAP,
  );

  const progress = registryRoadmap
    ? calculateRoadmapProgress(registryRoadmap.nodes, completedIds)
    : { completed: completedIds.size, total: 0, percentage: 0 };
  const ctaLabel = roadmapCtaLabel(progress.completed, progress.total);

  return (
    <Card
      className={cn(
        "group relative h-full overflow-hidden transition-colors duration-200",
        "hover:border-foreground/40",
        isComingSoon && "opacity-80 hover:opacity-100",
        className,
      )}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardDescription className="font-mono text-[11px] tracking-[0.12em] uppercase">
              {isComingSoon
                ? "Coming soon"
                : progress.completed > 0
                  ? `${progress.percentage}% complete`
                  : "Available now"}
            </CardDescription>
            <CardTitle className="text-xl font-bold tracking-[-0.03em]">
              {roadmap.title}
            </CardTitle>
          </div>
          {isLocked ? (
            <Badge variant="outline" className="shrink-0 gap-1">
              <Lock className="size-3" aria-hidden />
              Gated
            </Badge>
          ) : null}
        </div>
        <CardDescription className="text-sm leading-relaxed text-muted-foreground">
          {roadmap.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col space-y-4">
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{difficultyLabels[roadmap.difficulty]}</Badge>
          <Badge variant="outline" className="gap-1">
            <Clock className="size-3" aria-hidden />
            {roadmap.duration}
          </Badge>
          <Badge variant="outline" className="gap-1">
            <FolderKanban className="size-3" aria-hidden />
            {roadmap.projectCount} projects
          </Badge>
        </div>
        {roadmap.prerequisite ? (
          <p className="font-mono text-[11px] text-muted-foreground">
            {roadmap.prerequisite}
          </p>
        ) : (
          <p className="invisible font-mono text-[11px]" aria-hidden>
            &nbsp;
          </p>
        )}
      </CardContent>

      <CardFooter className="mt-auto">
        {isComingSoon ? (
          <Button variant="secondary" disabled className="w-full sm:w-auto">
            Coming soon
          </Button>
        ) : (
          <Button asChild className="w-full sm:w-auto">
            <Link href={`/roadmaps/${roadmap.slug}`}>
              {ctaLabel}
              <ArrowRight
                className="transition-transform group-hover:translate-x-0.5"
                aria-hidden
              />
            </Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
