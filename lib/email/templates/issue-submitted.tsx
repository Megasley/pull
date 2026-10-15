import { Text } from "@react-email/components";

import { EmailLayout } from "@/lib/email/templates/layout";

type IssueSubmittedEmailProps = {
  displayName: string;
  submitterUsername: string;
  repoFullName: string;
  issueNumber: number;
  issueTitle: string;
  issueUrl: string;
  href: string;
};

export function IssueSubmittedEmail({
  displayName,
  submitterUsername,
  repoFullName,
  issueNumber,
  issueTitle,
  issueUrl,
  href,
}: IssueSubmittedEmailProps) {
  return (
    <EmailLayout
      preview={`New issue submitted: ${repoFullName} #${issueNumber}`}
      title="An issue is waiting for approval"
      ctaLabel="Review submission"
      ctaHref={href}
    >
      <Text style={{ margin: "0 0 12px" }}>Hey {displayName},</Text>
      <Text style={{ margin: "0 0 12px" }}>
        @{submitterUsername} submitted{" "}
        <a href={issueUrl}>
          <strong>
            {repoFullName} #{issueNumber}
          </strong>
        </a>{" "}
        ({issueTitle}) for the issue recommendations. It&apos;s been pre-classified from its
        GitHub labels. Check it and approve it to put it live.
      </Text>
    </EmailLayout>
  );
}
