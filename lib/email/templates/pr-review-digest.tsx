import { Link, Text } from "@react-email/components";

import { EmailLayout } from "@/lib/email/templates/layout";

type DigestItem = {
  repoFullName: string;
  number: number;
  title: string;
  href: string;
};

type PrReviewDigestEmailProps = {
  displayName: string;
  items: DigestItem[];
  href: string;
};

export function PrReviewDigestEmail({ displayName, items, href }: PrReviewDigestEmailProps) {
  return (
    <EmailLayout
      preview={`${items.length} PR${items.length === 1 ? "" : "s"} still waiting for a reviewer`}
      title="Real PRs, waiting for a real review"
      ctaLabel="Browse the queue"
      ctaHref={href}
    >
      <Text style={{ margin: "0 0 12px" }}>Hey {displayName},</Text>
      <Text style={{ margin: "0 0 12px" }}>
        These have been sitting in Pull&apos;s review queue for a while — pick one up and leave a
        real review on GitHub:
      </Text>
      {items.map((item) => (
        <Text key={`${item.repoFullName}#${item.number}`} style={{ margin: "0 0 10px" }}>
          <Link href={item.href} style={{ color: "#231e1e", textDecoration: "underline" }}>
            {item.repoFullName} #{item.number}
          </Link>
          <br />
          <span style={{ color: "#5c5856" }}>{item.title}</span>
        </Text>
      ))}
    </EmailLayout>
  );
}
