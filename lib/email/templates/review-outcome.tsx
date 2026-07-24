import { Text } from "@react-email/components";

import { EmailLayout } from "@/lib/email/templates/layout";

type ReviewOutcomeEmailProps = {
  displayName: string;
  projectTitle: string;
  outcome: "approved" | "changes_requested" | "rejected";
  comment?: string;
  href: string;
};

const copy = {
  approved: {
    preview: "Your project submission was approved",
    title: "Submission approved",
    body: "Your submission cleared review. Nice work.",
    cta: "View project",
  },
  changes_requested: {
    preview: "Changes requested on your submission",
    title: "Changes requested",
    body: "A reviewer asked for updates before this can be approved.",
    cta: "Update submission",
  },
  rejected: {
    preview: "Your project submission was rejected",
    title: "Submission rejected",
    body: "This submission was closed. Review the feedback and try again if you want.",
    cta: "View feedback",
  },
} as const;

export function ReviewOutcomeEmail({
  displayName,
  projectTitle,
  outcome,
  comment,
  href,
}: ReviewOutcomeEmailProps) {
  const strings = copy[outcome];

  return (
    <EmailLayout
      preview={strings.preview}
      title={strings.title}
      ctaLabel={strings.cta}
      ctaHref={href}
    >
      <Text style={{ margin: "0 0 12px" }}>Hey {displayName},</Text>
      <Text style={{ margin: "0 0 12px" }}>
        <strong>{projectTitle}</strong> — {strings.body}
      </Text>
      {comment ? (
        <Text
          style={{
            backgroundColor: "#e8e8e2",
            margin: "0 0 12px",
            padding: "12px",
            whiteSpace: "pre-wrap",
          }}
        >
          {comment}
        </Text>
      ) : null}
    </EmailLayout>
  );
}
