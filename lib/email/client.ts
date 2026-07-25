import { Resend } from "resend";

import { siteConfig } from "@/lib/site-config";

let client: Resend | null | undefined;

export function getResendClient(): Resend | null {
  if (client !== undefined) {
    return client;
  }

  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    client = null;
    return client;
  }

  client = new Resend(apiKey);
  return client;
}

export function getResendFromAddress(): string {
  return (
    process.env.RESEND_FROM?.trim() || "Pull <onboarding@resend.dev>"
  );
}

/** Always route replies to the public support inbox. */
export function getResendReplyToAddress(): string {
  return `Pull <${siteConfig.contactEmail}>`;
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}
