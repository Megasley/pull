"use server";

import { sendEmail } from "@/lib/email/send";
import { ToolSuggestionEmail } from "@/lib/email/templates/tool-suggestion";
import {
  DEVELOPER_TOOL_CATEGORIES,
  type DeveloperToolCategory,
} from "@/lib/developer-tools";
import { siteConfig } from "@/lib/site-config";

export type SuggestDeveloperToolResult = { ok: true } | { ok: false; error: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_SHORT = 120;
const MAX_WHY = 1000;

function readTrimmed(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isCategory(value: string): value is DeveloperToolCategory {
  return (DEVELOPER_TOOL_CATEGORIES as readonly string[]).includes(value);
}

export async function suggestDeveloperToolAction(
  formData: FormData,
): Promise<SuggestDeveloperToolResult> {
  // Honeypot — bots fill hidden fields; humans leave them empty.
  const honeypot = readTrimmed(formData, "company");
  if (honeypot) {
    return { ok: true };
  }

  const toolName = readTrimmed(formData, "toolName");
  const website = readTrimmed(formData, "website");
  const docs = readTrimmed(formData, "docs");
  const github = readTrimmed(formData, "github");
  const category = readTrimmed(formData, "category");
  const buildUseCase = readTrimmed(formData, "buildUseCase");
  const why = readTrimmed(formData, "why");
  const submitterName = readTrimmed(formData, "submitterName");
  const submitterEmail = readTrimmed(formData, "submitterEmail");

  if (!toolName || toolName.length > MAX_SHORT) {
    return { ok: false, error: "Enter a tool name (max 120 characters)." };
  }
  if (!website || !isHttpUrl(website)) {
    return { ok: false, error: "Enter a valid website URL (https://…)." };
  }
  if (docs && !isHttpUrl(docs)) {
    return { ok: false, error: "Docs must be a valid URL, or leave blank." };
  }
  if (github && !isHttpUrl(github)) {
    return { ok: false, error: "GitHub must be a valid URL, or leave blank." };
  }
  if (!isCategory(category)) {
    return { ok: false, error: "Choose a category." };
  }
  if (buildUseCase.length > MAX_SHORT) {
    return { ok: false, error: "Build use case must be 120 characters or fewer." };
  }
  if (!why || why.length > MAX_WHY) {
    return {
      ok: false,
      error: "Tell us why it belongs (max 1000 characters).",
    };
  }
  if (submitterName.length > MAX_SHORT) {
    return { ok: false, error: "Name must be 120 characters or fewer." };
  }
  if (
    !submitterEmail ||
    !EMAIL_RE.test(submitterEmail) ||
    submitterEmail.length > 254
  ) {
    return { ok: false, error: "Enter a valid email so we can follow up." };
  }

  const result = await sendEmail({
    to: siteConfig.contactEmail,
    subject: `[Tool suggestion] ${toolName}`,
    replyTo: submitterEmail,
    react: ToolSuggestionEmail({
      toolName,
      website,
      docs: docs || null,
      github: github || null,
      category,
      buildUseCase: buildUseCase || null,
      why,
      submitterName: submitterName || null,
      submitterEmail,
    }),
  });

  if (!result.ok) {
    if (result.reason === "not_configured") {
      return {
        ok: false,
        error:
          "Email is not configured yet. Try again later or email hello@pullos.dev.",
      };
    }
    return {
      ok: false,
      error: "Could not send your suggestion. Please try again in a moment.",
    };
  }

  return { ok: true };
}
