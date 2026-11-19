"use server";

import { redirect } from "next/navigation";

import { subscribeToZohoCampaignsList } from "@/lib/zoho-campaigns/client";
import { isZohoCampaignsConfigured } from "@/lib/zoho-campaigns/env";

/** Values are echoed back so the fields keep what was typed after an error. */
export type NewsletterSubscribeState = {
  error: string;
  /** The field the error is about, for aria-invalid; null for general errors. */
  field: "email" | "firstName" | null;
  email: string;
  firstName: string;
} | null;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_FIRST_NAME = 60;

function readTrimmed(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function subscribeToNewsletterAction(
  _prevState: NewsletterSubscribeState,
  formData: FormData,
): Promise<NewsletterSubscribeState> {
  const email = readTrimmed(formData, "email");
  // Optional. Strip control characters and collapse whitespace: it ends up in
  // email greetings via Zoho's $[FNAME]$ merge tag.
  const firstName = readTrimmed(formData, "firstName")
    .replace(/[\p{Cc}\p{Cf}]/gu, "")
    .replace(/\s+/g, " ");

  // Honeypot — bots fill hidden fields; humans leave them empty. Bots get the
  // same thanks page so they can't tell they were filtered.
  if (readTrimmed(formData, "website")) {
    redirect("/newsletter/thanks");
  }

  if (!isZohoCampaignsConfigured()) {
    return {
      error: "Newsletter signups aren't available right now.",
      field: null,
      email,
      firstName,
    };
  }

  if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
    return { error: "Enter a valid email address.", field: "email", email, firstName };
  }

  if (firstName.length > MAX_FIRST_NAME) {
    return {
      error: `First name must be ${MAX_FIRST_NAME} characters or fewer.`,
      field: "firstName",
      email,
      firstName,
    };
  }

  try {
    await subscribeToZohoCampaignsList(email, {
      source: "pullos.dev footer",
      firstName: firstName || undefined,
    });
  } catch (error) {
    // Zoho errors can include HTML or internal codes — log, don't show.
    console.error("[newsletter] Zoho Campaigns subscribe failed:", error);
    return {
      error: "We couldn't subscribe you just now. Please try again.",
      field: null,
      email,
      firstName,
    };
  }

  redirect("/newsletter/thanks");
}
