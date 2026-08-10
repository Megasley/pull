import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { SUBMISSION_STATUS_LABELS, type SubmissionStatus } from "@/types/submission";

const statusVariant: Record<SubmissionStatus, "secondary" | "outline" | "default"> = {
  draft: "outline",
  submitted: "secondary",
  under_review: "secondary",
  needs_changes: "outline",
  approved: "default",
  rejected: "outline",
};

type SubmissionStatusBadgeProps = {
  status: SubmissionStatus;
  className?: string;
};

export function SubmissionStatusBadge({
  status,
  className,
}: SubmissionStatusBadgeProps) {
  return (
    <Badge
      variant={statusVariant[status]}
      className={cn("font-mono text-[11px] tracking-wide", className)}
    >
      {SUBMISSION_STATUS_LABELS[status]}
    </Badge>
  );
}
