export type SubmissionStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "needs_changes"
  | "approved"
  | "rejected";

export type UserRole = "builder" | "reviewer" | "admin";

export type ReviewEventType = "status_change" | "comment";

export type ReviewDecision = "approve" | "request_changes" | "reject";

export type ReviewAction = "start_review" | "approve" | "reject" | "request_changes" | "comment";

export type SubmissionInput = {
  repoUrl: string | null;
  prUrl?: string | null;
  liveDemoUrl?: string | null;
  videoDemoUrl?: string | null;
  screenshotUrls?: string[];
  notes?: string;
};

export type ProjectSubmissionRecord = {
  id: string;
  userId: string;
  projectId: string;
  projectSlug: string;
  projectTitle: string;
  status: SubmissionStatus;
  repoUrl: string | null;
  prUrl: string | null;
  liveDemoUrl: string | null;
  videoDemoUrl: string | null;
  screenshotUrls: string[];
  notes: string;
  submittedAt: string | null;
  reviewedAt: string | null;
  reviewRound: number;
  claimedBy: string | null;
  claimExpiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  builderUsername?: string;
  builderDisplayName?: string;
  builderAvatar?: string | null;
  approvalCount?: number;
  requiredApprovals?: number;
  myDecision?: ReviewDecision | null;
};

export type ReviewTimelineEvent = {
  id: string;
  submissionId: string;
  actorUserId: string | null;
  actorDisplayName: string | null;
  actorUsername: string | null;
  type: ReviewEventType;
  fromStatus: SubmissionStatus | null;
  toStatus: SubmissionStatus | null;
  body: string;
  createdAt: string;
};

export const ACTIVE_SUBMISSION_STATUSES: SubmissionStatus[] = [
  "draft",
  "submitted",
  "under_review",
  "needs_changes",
];

export const LOCKED_SUBMISSION_STATUSES: SubmissionStatus[] = [
  "submitted",
  "under_review",
];

export const REVIEW_QUEUE_STATUSES: SubmissionStatus[] = [
  "submitted",
  "under_review",
  "needs_changes",
];

export const SUBMISSION_STATUS_LABELS: Record<SubmissionStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  under_review: "In review",
  needs_changes: "Needs changes",
  approved: "Approved",
  rejected: "Rejected",
};
