/**
 * One-off notification smoke test. Loads .env.local and sends via sendEmail.
 * Usage: npx tsx scripts/test-notifications.ts [to]
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvLocal() {
  const path = resolve(process.cwd(), ".env.local");
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }
    const eq = trimmed.indexOf("=");
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env) || !process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnvLocal();

async function main() {
  const to = (process.argv[2] || "hello@pullos.dev").trim();

  const { getResendFromAddress, getResendReplyToAddress, isEmailConfigured } =
    await import("../lib/email/client");
  const { sendEmail } = await import("../lib/email/send");
  const { WelcomeEmail } = await import("../lib/email/templates/welcome");
  const { ReviewOutcomeEmail } = await import(
    "../lib/email/templates/review-outcome"
  );
  const { ReviewQueueEmail } = await import(
    "../lib/email/templates/review-queue"
  );

  console.log("configured:", isEmailConfigured());
  console.log("from:", getResendFromAddress());
  console.log("replyTo:", getResendReplyToAddress());
  console.log("to:", to);

  if (!isEmailConfigured()) {
    console.error("RESEND_API_KEY is not set — cannot send.");
    process.exit(1);
  }

  const results = [];

  results.push({
    kind: "welcome",
    result: await sendEmail({
      to,
      subject: "[Pull test] Welcome notification",
      react: WelcomeEmail({
        displayName: "Megasley",
        href: "https://pullos.dev/dashboard",
      }),
    }),
  });

  results.push({
    kind: "review-outcome",
    result: await sendEmail({
      to,
      subject: "[Pull test] Review outcome — approved",
      react: ReviewOutcomeEmail({
        displayName: "Megasley",
        projectTitle: "Hello Regtest",
        outcome: "approved",
        comment: "Solid evidence — nice work.",
        href: "https://pullos.dev/projects/hello-regtest",
      }),
    }),
  });

  results.push({
    kind: "review-queue",
    result: await sendEmail({
      to,
      subject: "[Pull test] Review queue",
      react: ReviewQueueEmail({
        displayName: "Megasley",
        projectTitle: "Bolt11 Decoder",
        submitterUsername: "Alice",
        href: "https://pullos.dev/review",
      }),
    }),
  });

  for (const item of results) {
    console.log(item.kind, item.result);
  }

  const failed = results.filter((item) => !item.result.ok);
  if (failed.length > 0) {
    process.exit(1);
  }

  const lastOk = [...results]
    .reverse()
    .find((item) => item.result.ok && item.result.id);
  const id = lastOk && lastOk.result.ok ? lastOk.result.id : null;

  if (id) {
    const key = process.env.RESEND_API_KEY!.trim();
    const res = await fetch(`https://api.resend.com/emails/${id}`, {
      headers: { Authorization: `Bearer ${key}` },
    });
    const body = (await res.json()) as Record<string, unknown>;
    console.log("resend_get_status:", res.status);
    console.log("resend_from:", body.from);
    console.log("resend_reply_to:", body.reply_to ?? body.replyTo);
    console.log("resend_to:", body.to);
    console.log("resend_subject:", body.subject);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
