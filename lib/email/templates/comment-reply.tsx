import { Text } from "@react-email/components";

import { EmailLayout } from "@/lib/email/templates/layout";

type CommentReplyEmailProps = {
  displayName: string;
  replyAuthorUsername: string;
  entityTitle: string;
  href: string;
};

export function CommentReplyEmail({
  displayName,
  replyAuthorUsername,
  entityTitle,
  href,
}: CommentReplyEmailProps) {
  return (
    <EmailLayout
      preview={`${replyAuthorUsername} replied to your question`}
      title="New reply on your question"
      ctaLabel="View discussion"
      ctaHref={href}
    >
      <Text style={{ margin: "0 0 12px" }}>Hey {displayName},</Text>
      <Text style={{ margin: "0 0 12px" }}>
        <strong>@{replyAuthorUsername}</strong> replied to your question on{" "}
        <strong>{entityTitle}</strong>.
      </Text>
    </EmailLayout>
  );
}
