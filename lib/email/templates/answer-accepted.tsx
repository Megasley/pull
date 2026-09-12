import { Text } from "@react-email/components";

import { EmailLayout } from "@/lib/email/templates/layout";

type AnswerAcceptedEmailProps = {
  displayName: string;
  entityTitle: string;
  href: string;
};

export function AnswerAcceptedEmail({
  displayName,
  entityTitle,
  href,
}: AnswerAcceptedEmailProps) {
  return (
    <EmailLayout
      preview="Your answer was accepted"
      title="Your answer was accepted"
      ctaLabel="View discussion"
      ctaHref={href}
    >
      <Text style={{ margin: "0 0 12px" }}>Hey {displayName},</Text>
      <Text style={{ margin: "0 0 12px" }}>
        Your reply on <strong>{entityTitle}</strong> was marked as the accepted
        answer. Thanks for helping another builder debug.
      </Text>
    </EmailLayout>
  );
}
