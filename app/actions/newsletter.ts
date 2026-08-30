"use server";

import { redirect } from "next/navigation";

import { subscribeToZohoCampaignsList } from "@/lib/zoho-campaigns/client";
import { isZohoCampaignsConfigured } from "@/lib/zoho-campaigns/env";

export type NewsletterSubscribeState = { error: string } | null;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function subscribeToNewsletterAction(
  _prevState: NewsletterSubscribeState,
  formData: FormData,
): Promise<NewsletterSubscribeState> {
  if (!isZohoCampaignsConfigured()) {
    return { error: "Newsletter signups aren't configured yet." };
  }

  const email = (formData.get("email") as string)?.trim();
  if (!email || !EMAIL_RE.test(email)) {
    return { error: "Enter a valid email address." };
  }

  try {
    await subscribeToZohoCampaignsList(email);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not subscribe. Try again.",
    };
  }

  redirect("/newsletter/thanks");
}
