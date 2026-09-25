import { parseSkillsInput } from "@/lib/profile/portfolio";
import { normalizeLookingFor, type LookingForId } from "@/lib/builders/looking-for";
import { isKnownCountryCode } from "@/lib/geo/countries";
import { isOpenToStatus, type OpenToStatus } from "@/lib/profile/open-to";

const MAX_BIO_LENGTH = 280;
const MAX_PINNED_REPOS = 4;

/** Dedupe and cap at MAX_PINNED_REPOS, preserving the submitted order —
 *  order is the builder's own display choice. Cross-checking against their
 *  actual synced repos happens server-side, where the repo list is
 *  available (this module stays pure / dependency-free). */
function normalizePinnedRepos(value: string[] | string | undefined): string[] {
  const raw = Array.isArray(value) ? value : typeof value === "string" ? [value] : [];
  const seen = new Set<string>();
  const result: string[] = [];

  for (const entry of raw) {
    const fullName = entry.trim();
    if (!fullName || seen.has(fullName)) continue;
    seen.add(fullName);
    result.push(fullName);
    if (result.length >= MAX_PINNED_REPOS) break;
  }

  return result;
}

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
        /** undefined = leave unchanged; null = user cleared it. */
        country?: string | null;
        showCountryPublicly: boolean;
        openTo: OpenToStatus | null;
        pinnedRepos: string[];
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
  /** Absent = field not submitted, leave unchanged. Empty string = cleared. */
  country?: FormDataEntryValue | null;
  showCountryPublicly?: FormDataEntryValue | null;
  openTo?: FormDataEntryValue | null;
  pinnedRepos?: string[] | string;
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

  if (bio.length > MAX_BIO_LENGTH) {
    return { ok: false, error: `Bio must be ${MAX_BIO_LENGTH} characters or fewer.` };
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

  let country: string | null | undefined;
  if (input.country !== undefined) {
    const raw = String(input.country ?? "")
      .trim()
      .toUpperCase();
    if (!raw) {
      country = null;
    } else if (isKnownCountryCode(raw)) {
      country = raw;
    } else {
      return { ok: false, error: "Please choose a country from the list." };
    }
  }

  // Can't show a flag for a country that's blank — force off if the user is
  // clearing their country in this same submission. If country isn't part of
  // this submission at all (undefined), trust the checkbox as sent.
  const showCountryPublicly =
    country === null ? false : parseCheckbox(input.showCountryPublicly);

  const rawOpenTo = typeof input.openTo === "string" ? input.openTo.trim() : "";
  let openTo: OpenToStatus | null = null;
  if (rawOpenTo) {
    if (!isOpenToStatus(rawOpenTo)) {
      return { ok: false, error: "Please choose a valid \"Open to\" status." };
    }
    openTo = rawOpenTo;
  }

  const pinnedRepos = normalizePinnedRepos(input.pinnedRepos);

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
      country,
      showCountryPublicly,
      openTo,
      pinnedRepos,
    },
  };
}
