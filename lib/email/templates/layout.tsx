import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { ReactNode } from "react";

const colors = {
  ink: "#231e1e",
  signal: "#c8f231",
  paper: "#f4f4ef",
  muted: "#5c5856",
  border: "#231e1e1f",
};

type EmailLayoutProps = {
  preview: string;
  title: string;
  children: ReactNode;
  ctaLabel?: string;
  ctaHref?: string;
};

export function EmailLayout({
  preview,
  title,
  children,
  ctaLabel,
  ctaHref,
}: EmailLayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body
        style={{
          backgroundColor: colors.paper,
          fontFamily:
            'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
          margin: 0,
          padding: "32px 16px",
        }}
      >
        <Container
          style={{
            backgroundColor: colors.paper,
            border: `1px solid ${colors.border}`,
            margin: "0 auto",
            maxWidth: "560px",
            padding: "28px 24px",
          }}
        >
          <Text
            style={{
              color: colors.muted,
              fontSize: "11px",
              letterSpacing: "0.14em",
              margin: "0 0 16px",
              textTransform: "uppercase",
            }}
          >
            Pull
          </Text>
          <Heading
            style={{
              color: colors.ink,
              fontSize: "24px",
              fontWeight: 700,
              letterSpacing: "-0.03em",
              lineHeight: 1.2,
              margin: "0 0 16px",
            }}
          >
            {title}
          </Heading>
          <Section style={{ color: colors.ink, fontSize: "14px", lineHeight: 1.6 }}>
            {children}
          </Section>
          {ctaLabel && ctaHref ? (
            <Section style={{ marginTop: "24px" }}>
              <Button
                href={ctaHref}
                style={{
                  backgroundColor: colors.signal,
                  color: colors.ink,
                  display: "inline-block",
                  fontSize: "13px",
                  fontWeight: 700,
                  letterSpacing: "0.02em",
                  padding: "12px 18px",
                  textDecoration: "none",
                }}
              >
                {ctaLabel}
              </Button>
            </Section>
          ) : null}
          <Hr
            style={{
              borderColor: colors.border,
              borderTop: `1px solid ${colors.border}`,
              margin: "28px 0 16px",
            }}
          />
          <Text
            style={{
              color: colors.muted,
              fontSize: "11px",
              lineHeight: 1.5,
              margin: 0,
            }}
          >
            Manage email preferences in Settings → Notifications.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
