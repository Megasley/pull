import { Text } from "@react-email/components";

import { EmailLayout } from "@/lib/email/templates/layout";

type WelcomeEmailProps = {
  displayName: string;
  href: string;
};

export function WelcomeEmail({ displayName, href }: WelcomeEmailProps) {
  return (
    <EmailLayout
      preview="Welcome to Pull"
      title="Welcome to Pull"
      ctaLabel="Open dashboard"
      ctaHref={href}
    >
      <Text style={{ margin: "0 0 12px" }}>Hey {displayName},</Text>
      <Text style={{ margin: "0 0 12px" }}>
        You&apos;re in. Learn Bitcoin and Lightning, ship projects, and land meaningful
        contributions.
      </Text>
      <Text style={{ margin: 0 }}>
        Start with a roadmap, then ship your first project.
      </Text>
    </EmailLayout>
  );
}
