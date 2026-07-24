import type { ReactElement } from "react";

import {
  getResendClient,
  getResendFromAddress,
  isEmailConfigured,
} from "@/lib/email/client";

export type SendEmailInput = {
  to: string;
  subject: string;
  react: ReactElement;
};

export type SendEmailResult =
  | { ok: true; id: string | null }
  | { ok: false; reason: "not_configured" | "send_failed"; error?: unknown };

export async function sendEmail(
  input: SendEmailInput,
): Promise<SendEmailResult> {
  if (!isEmailConfigured()) {
    return { ok: false, reason: "not_configured" };
  }

  const resend = getResendClient();
  if (!resend) {
    return { ok: false, reason: "not_configured" };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: getResendFromAddress(),
      to: input.to,
      subject: input.subject,
      react: input.react,
    });

    if (error) {
      console.error("[email] Resend send failed:", error);
      return { ok: false, reason: "send_failed", error };
    }

    return { ok: true, id: data?.id ?? null };
  } catch (error) {
    console.error("[email] Resend send threw:", error);
    return { ok: false, reason: "send_failed", error };
  }
}
