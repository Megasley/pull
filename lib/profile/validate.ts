import { parseSkillsInput } from "@/lib/profile/portfolio";
import { normalizeLookingFor, type LookingForId } from "@/lib/builders/looking-for";

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

function parseCheckbox(value: FormDataEntryValue | null | undefined): boolean {
  if (typeof value !== "string") return false;
  return value === "on" || value === "true" || value === "1";
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
        lookingFor: LookingForId[];
        profilePublic: boolean;
        listedInDirectory: boolean;
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
  lookingFor?: string[] | string;
  profilePublic?: FormDataEntryValue | null;
  listedInDirectory?: FormDataEntryValue | null;
}): ProfileEditValidation {
  const displayName = input.displayName?.trim() ?? "";
  const bio = input.bio?.trim() ?? "";
  const website = normalizeOptionalHttpUrl(input.website);
  const twitterUrl = normalizeOptionalHttpUrl(input.twitterUrl);
  const linkedinUrl = normalizeOptionalHttpUrl(input.linkedinUrl);
  const skills = parseSkillsInput(input.skills);
  const lookingFor = normalizeLookingFor(
    Array.isArray(input.lookingFor)
      ? input.lookingFor
      : typeof input.lookingFor === "string"
        ? input.lookingFor.split(",")
        : [],
  );
  const profilePublic = parseCheckbox(input.profilePublic);
  const listedInDirectory = profilePublic
    ? parseCheckbox(input.listedInDirectory)
    : false;

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
    data: {
      displayName,
      bio,
      website,
      twitterUrl,
      linkedinUrl,
      skills,
      lookingFor,
      profilePublic,
      listedInDirectory,
    },
  };
}
