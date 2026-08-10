"use client";

import Link from "next/link";
import { ExternalLink, GitPullRequest } from "lucide-react";
import { useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { recommendReviewClubItems } from "@/lib/review-club/recommend";

type LessonReviewClubProps = {
  lessonSlug: string;
  sectionId?: string | null;
  track?: string;
  showSectionBundle?: boolean;
};

const TRACK_COPY: Record<string, { label: string; blurb: string }> = {
  bitcoin: {
    label: "Bitcoin",
    blurb:
      "Practice on real Bitcoin OSS changes tied to this chapter. Read the diff, use the checklist, and optionally paste your review comment URL in your lab notes.",
  },
  lightning: {
    label: "Lightning",
    blurb:
      "Practice on real Lightning OSS changes tied to this chapter. Read the diff, use the checklist, and optionally paste your review comment URL in your lab notes.",
  },
};

const REVIEW_CHECKLIST = [
  "Does the change solve the stated problem?",
  "Are edge cases and rollout behavior covered?",
  "Are tests or test vectors included?",
  "Is the diff minimal and clearly explained?",
];

export function LessonReviewClub({
  lessonSlug,
  sectionId,
  track = "lightning",
  showSectionBundle = false,
}: LessonReviewClubProps) {
  const copy = TRACK_COPY[track] ?? TRACK_COPY.lightning;

  const items = useMemo(
    () =>
      recommendReviewClubItems({
        lessonSlug,
        sectionId: showSectionBundle ? sectionId : undefined,
        track,
        limit: showSectionBundle ? 6 : 3,
      }),
    [lessonSlug, sectionId, showSectionBundle, track],
  );

  if (items.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4 rounded-none border border-border bg-card p-6">
      <div className="flex items-start gap-3">
        <GitPullRequest className="mt-0.5 size-5 shrink-0 text-ink" />
        <div>
          <p className="tech-eyebrow">review // club</p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight">
            {showSectionBundle ? "Chapter review picks" : "Review club"}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {copy.blurb}
          </p>
        </div>
      </div>

      <ul className="space-y-4">
        {items.map((item) => (
          <li
            key={item.id}
            className="space-y-3 border border-border bg-background p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 space-y-1">
                <p className="font-medium">{item.title}</p>
                <p className="text-sm text-muted-foreground">{item.summary}</p>
              </div>
              <Badge variant="outline" className="shrink-0 capitalize">
                {item.kind.replace("_", " ")}
              </Badge>
            </div>

            <div className="flex flex-wrap gap-2">
              {item.reviewFocus.map((focus) => (
                <Badge
                  key={focus}
                  variant="secondary"
                  className="font-mono text-[10px]"
                >
                  {focus}
                </Badge>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3 font-mono text-[11px] text-muted-foreground">
              <span>{item.estimatedMinutes} min</span>
              <span>·</span>
              <span>{item.difficulty}</span>
              <Link
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-foreground underline underline-offset-2"
              >
                open on GitHub
                <ExternalLink className="size-3" aria-hidden />
              </Link>
            </div>
          </li>
        ))}
      </ul>

      <details className="border border-border bg-background p-4">
        <summary className="cursor-pointer font-mono text-xs font-medium">
          review checklist
        </summary>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
          {REVIEW_CHECKLIST.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      </details>

      <p className="font-mono text-[11px] text-muted-foreground">
        More repos and GFIs on{" "}
        <Link href="/discover" className="underline underline-offset-2">
          /discover
        </Link>{" "}
        and{" "}
        <Link href="/issues" className="underline underline-offset-2">
          /issues
        </Link>
        .
      </p>
    </section>
  );
}
