"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink } from "lucide-react";

import {
  approveIssueSubmissionAction,
  rejectIssueSubmissionAction,
} from "@/app/actions/issue-submissions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ISSUE_CATEGORIES, ISSUE_CATEGORY_SINGULAR } from "@/lib/issues/engine";
import {
  SUBMITTED_ISSUE_STATUS_CLASS,
  SUBMITTED_ISSUE_STATUS_LABEL,
} from "@/lib/issues/submission-format";
import type { SubmittedIssueRecord } from "@/lib/issues/submissions";
import { formatRelativeTime } from "@/lib/pr-reviews/format";
import { cn } from "@/lib/utils";
import type { RoadmapDifficulty } from "@/types";
import type { DiscoveryTrack } from "@/types/discovery";
import type { IssueCategory } from "@/types/issues";

const DIFFICULTIES: RoadmapDifficulty[] = ["beginner", "intermediate", "advanced"];
const TRACKS: Array<{ value: DiscoveryTrack; label: string }> = [
  { value: "bitcoin", label: "Bitcoin" },
  { value: "lightning", label: "Lightning" },
];

const fieldClass =
  "w-full rounded-none border border-border bg-transparent px-2.5 py-1.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function AdminIssueSubmissionCard({ submission }: { submission: SubmittedIssueRecord }) {
  const router = useRouter();
  const [category, setCategory] = useState<IssueCategory>(submission.category);
  const [difficulty, setDifficulty] = useState<RoadmapDifficulty>(submission.difficulty);
  const [tracks, setTracks] = useState<DiscoveryTrack[]>(submission.tracks);
  const [skills, setSkills] = useState(submission.skills.join(", "));
  const [hours, setHours] = useState(String(submission.estimatedHours));
  const [summary, setSummary] = useState(submission.summary);
  const [rejectReason, setRejectReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const editable = submission.status === "pending" || submission.status === "rejected";
  const idPrefix = `submission-${submission.id}`;

  function toggleTrack(track: DiscoveryTrack) {
    setTracks((current) =>
      current.includes(track) ? current.filter((item) => item !== track) : [...current, track],
    );
  }

  function approve() {
    setError(null);
    startTransition(async () => {
      const result = await approveIssueSubmissionAction({
        id: submission.id,
        category,
        difficulty,
        tracks,
        skills: skills.split(","),
        estimatedHours: Number(hours),
        summary,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function reject() {
    setError(null);
    startTransition(async () => {
      const result = await rejectIssueSubmissionAction(submission.id, rejectReason);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setRejectReason("");
      router.refresh();
    });
  }

  return (
    <li
      className={cn(
        "space-y-4 border-l-4 border-y border-r border-border bg-card p-4",
        submission.status === "pending" ? "border-l-signal" : "border-l-ink/15",
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={cn("text-[10px]", SUBMITTED_ISSUE_STATUS_CLASS[submission.status])}>
              {SUBMITTED_ISSUE_STATUS_LABEL[submission.status]}
            </Badge>
            <span className="font-mono text-[11px] text-muted-foreground">
              {submission.repoFullName} #{submission.number}
            </span>
            <span className="text-[11px] text-muted-foreground">
              submitted {formatRelativeTime(submission.createdAt)}
              {submission.submittedByUsername ? ` by @${submission.submittedByUsername}` : ""}
            </span>
          </div>
          <p className="text-sm font-medium break-words text-foreground">{submission.title}</p>
          <p className="text-[11px] text-muted-foreground">
            GitHub labels: {submission.labels.length > 0 ? submission.labels.join(", ") : "none"}
            {submission.language ? ` · ${submission.language}` : ""}
          </p>
          {submission.moderatedByUsername && submission.moderatedAt ? (
            <p className="text-[11px] text-muted-foreground">
              {submission.status === "rejected" ? "Rejected" : "Moderated"} by @
              {submission.moderatedByUsername} {formatRelativeTime(submission.moderatedAt)}
              {submission.rejectionReason ? ` · ${submission.rejectionReason}` : ""}
            </p>
          ) : null}
        </div>
        <Button asChild size="sm" variant="outline" className="shrink-0">
          <a href={submission.issueUrl} target="_blank" rel="noreferrer">
            View on GitHub
            <ExternalLink className="size-3.5" aria-hidden />
          </a>
        </Button>
      </div>

      {editable ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-xs text-muted-foreground" htmlFor={`${idPrefix}-category`}>
            Category
            <select
              id={`${idPrefix}-category`}
              value={category}
              onChange={(event) => setCategory(event.target.value as IssueCategory)}
              className={fieldClass}
            >
              {ISSUE_CATEGORIES.map((value) => (
                <option key={value} value={value}>
                  {ISSUE_CATEGORY_SINGULAR[value]}
                </option>
              ))}
            </select>
          </label>
          <label
            className="space-y-1 text-xs text-muted-foreground"
            htmlFor={`${idPrefix}-difficulty`}
          >
            Difficulty
            <select
              id={`${idPrefix}-difficulty`}
              value={difficulty}
              onChange={(event) => setDifficulty(event.target.value as RoadmapDifficulty)}
              className={fieldClass}
            >
              {DIFFICULTIES.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-xs text-muted-foreground" htmlFor={`${idPrefix}-skills`}>
            Skills (comma-separated)
            <input
              id={`${idPrefix}-skills`}
              value={skills}
              onChange={(event) => setSkills(event.target.value)}
              className={fieldClass}
            />
          </label>
          <label className="space-y-1 text-xs text-muted-foreground" htmlFor={`${idPrefix}-hours`}>
            Estimated hours
            <input
              id={`${idPrefix}-hours`}
              type="number"
              min={1}
              max={200}
              value={hours}
              onChange={(event) => setHours(event.target.value)}
              className={fieldClass}
            />
          </label>
          <fieldset className="space-y-1 text-xs text-muted-foreground sm:col-span-2">
            <legend>Tracks</legend>
            <div className="flex flex-wrap gap-4 pt-1">
              {TRACKS.map((track) => (
                <label key={track.value} className="inline-flex items-center gap-2 text-sm text-foreground">
                  <input
                    type="checkbox"
                    checked={tracks.includes(track.value)}
                    onChange={() => toggleTrack(track.value)}
                  />
                  {track.label}
                </label>
              ))}
            </div>
          </fieldset>
          <label
            className="space-y-1 text-xs text-muted-foreground sm:col-span-2"
            htmlFor={`${idPrefix}-summary`}
          >
            Summary shown on the card
            <textarea
              id={`${idPrefix}-summary`}
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
              rows={3}
              maxLength={400}
              className={fieldClass}
            />
          </label>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{ISSUE_CATEGORY_SINGULAR[submission.category]}</Badge>
          <Badge variant="outline">{submission.difficulty}</Badge>
          {submission.skills.map((skill) => (
            <Badge key={skill} variant="outline">
              {skill}
            </Badge>
          ))}
          <span className="text-xs text-muted-foreground">~{submission.estimatedHours}h</span>
        </div>
      )}

      {error ? (
        <p
          className="rounded-none border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      {submission.status !== "closed" ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          {submission.status !== "rejected" ? (
            <input
              aria-label="Rejection reason (optional)"
              placeholder="Reason (optional, shown to submitter)"
              value={rejectReason}
              onChange={(event) => setRejectReason(event.target.value)}
              className={cn(fieldClass, "sm:max-w-xs")}
            />
          ) : null}
          {submission.status !== "rejected" ? (
            <Button type="button" variant="outline" size="sm" disabled={pending} onClick={reject}>
              {submission.status === "approved" ? "Take down" : "Reject"}
            </Button>
          ) : null}
          {editable ? (
            <Button type="button" size="sm" loading={pending} onClick={approve}>
              Approve & go live
            </Button>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}
