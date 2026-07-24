import { parseSkillsInput } from "@/lib/profile/portfolio";

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function normalizeOptionalHttpUrl(value: string | undefined | null) {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return null;
  return trimmed.replace(/\/$/, "");
}

export type ProfileEditValidation =
  | {
      ok: true;
      data: {
        displayName: string;
        bio: string;
        website: string | null;
        twitterUrl: string | null;
        linkedinUrl: string | null;
        skills: string[];
      };
    }
  | { ok: false; error: string };

export function validateProfileEditInput(input: {
  displayName?: string;
  bio?: string;
  website?: string;
  twitterUrl?: string;
  linkedinUrl?: string;
  skills?: string;
}): ProfileEditValidation {
  const displayName = input.displayName?.trim() ?? "";
  const bio = input.bio?.trim() ?? "";
  const website = normalizeOptionalHttpUrl(input.website);
  const twitterUrl = normalizeOptionalHttpUrl(input.twitterUrl);
  const linkedinUrl = normalizeOptionalHttpUrl(input.linkedinUrl);
  const skills = parseSkillsInput(input.skills);

  if (displayName.length < 2 || displayName.length > 80) {
    return { ok: false, error: "Display name must be between 2 and 80 characters." };
  }

  if (bio.length > 500) {
    return { ok: false, error: "Bio must be 500 characters or fewer." };
  }

  for (const [label, value] of [
    ["Website", website],
    ["X / Twitter", twitterUrl],
    ["LinkedIn", linkedinUrl],
  ] as const) {
    if (value && !isHttpUrl(value)) {
      return { ok: false, error: `${label} must be a valid http(s) URL.` };
    }
  }

  return {
    ok: true,
    data: { displayName, bio, website, twitterUrl, linkedinUrl, skills },
  };
}
