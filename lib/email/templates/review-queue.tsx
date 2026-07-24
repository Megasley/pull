import { Text } from "@react-email/components";

import { EmailLayout } from "@/lib/email/templates/layout";

type ReviewQueueEmailProps = {
  displayName: string;
  projectTitle: string;
  submitterUsername: string;
  href: string;
};

export function ReviewQueueEmail({
  displayName,
  projectTitle,
  submitterUsername,
  href,
}: ReviewQueueEmailProps) {
  return (
    <EmailLayout
      preview={`New review queue item: ${projectTitle}`}
      title="New submission in review queue"
      ctaLabel="Open review"
      ctaHref={href}
    >
      <Text style={{ margin: "0 0 12px" }}>Hey {displayName},</Text>
      <Text style={{ margin: "0 0 12px" }}>
        <strong>@{submitterUsername}</strong> submitted{" "}
        <strong>{projectTitle}</strong> for review.
      </Text>
    </EmailLayout>
  );
}
