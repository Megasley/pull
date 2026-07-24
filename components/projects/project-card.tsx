import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";

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
import { cn } from "@/lib/utils";
import type { ProjectCatalogItem } from "@/types/project";
import type { RoadmapDifficulty } from "@/types";

const difficultyLabels: Record<RoadmapDifficulty, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

const difficultyClass: Record<RoadmapDifficulty, string> = {
  beginner: "border-ink/20 bg-signal text-ink",
  intermediate: "border-ink/30 bg-ink/10 text-ink",
  advanced: "border-ink bg-ink text-[var(--background)]",
};

type ProjectCardProps = {
  project: ProjectCatalogItem;
  index?: number;
  className?: string;
};

export function ProjectCard({ project, index = 0, className }: ProjectCardProps) {
  return (
    <Card
      className={cn(
        "group relative flex h-full flex-col overflow-hidden border-border bg-card transition-all duration-300",
        "animate-fade-in-up hover:border-primary/30 hover:bg-card",
        className,
      )}
      style={{ animationDelay: `${Math.min(index, 12) * 50}ms` }}
    >
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            className={cn(
              "rounded-none font-mono text-[11px] tracking-[0.12em] uppercase",
              difficultyClass[project.difficulty],
            )}
          >
            {difficultyLabels[project.difficulty]}
          </Badge>
          <Badge variant="outline" className="gap-1 font-mono text-[11px]">
            <Clock className="size-3" aria-hidden />
            {project.estimatedTime}
          </Badge>
          <span className="font-mono text-[10px] tracking-wide text-muted-foreground uppercase">
            {project.roadmapSlug}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {project.categories.map((category) => (
            <Badge key={category} variant="outline" className="font-normal">
              {category}
            </Badge>
          ))}
        </div>

        <div className="space-y-1">
          <CardTitle className="text-xl leading-snug">{project.title}</CardTitle>
          <CardDescription className="text-sm leading-relaxed text-muted-foreground">
            {project.description}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="mt-auto space-y-4">
        <div className="space-y-2">
          <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            Skills
          </p>
          <div className="flex flex-wrap gap-1.5">
            {project.requiredSkills.slice(0, 4).map((skill) => (
              <span
                key={skill}
                className="rounded-none border border-border bg-muted/30 px-2 py-0.5 text-[11px] text-muted-foreground"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            Prerequisites
          </p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {project.prerequisites.slice(0, 3).join(" · ")}
            {project.prerequisites.length > 3 ? " · …" : ""}
          </p>
        </div>
      </CardContent>

      <CardFooter>
        <Button asChild className="w-full sm:w-auto">
          <Link href={`/projects/${project.slug}`}>
            ./view-project
            <ArrowRight
              className="transition-transform group-hover:translate-x-0.5"
              aria-hidden
            />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
