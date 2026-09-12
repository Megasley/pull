import { Text } from "@react-email/components";

import { EmailLayout } from "@/lib/email/templates/layout";

type PrReviewCompletedEmailProps = {
  displayName: string;
  repoFullName: string;
  prNumber: number;
  prTitle: string;
  href: string;
};

export function PrReviewCompletedEmail({
  displayName,
  repoFullName,
  prNumber,
  prTitle,
  href,
}: PrReviewCompletedEmailProps) {
  return (
    <EmailLayout
      preview="Your PR review request was reviewed"
      title="Your PR got a review"
      ctaLabel="View on GitHub"
      ctaHref={href}
    >
      <Text style={{ margin: "0 0 12px" }}>Hey {displayName},</Text>
      <Text style={{ margin: "0 0 12px" }}>
        A builder reviewed your request for{" "}
        <strong>
          {repoFullName} #{prNumber}
        </strong>{" "}
        ({prTitle}) on Pull. Check GitHub for the review.
      </Text>
    </EmailLayout>
  );
}
