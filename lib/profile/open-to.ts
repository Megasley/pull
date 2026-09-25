/** Optional public "hire me" status — see lib/db/schema/enums.ts:openToStatusEnum. */

export const OPEN_TO_OPTIONS = [
  { id: "work", label: "Work" },
  { id: "collaboration", label: "Collaboration" },
  { id: "mentoring", label: "Mentoring" },
  { id: "none", label: "Not right now" },
] as const;

export type OpenToStatus = (typeof OPEN_TO_OPTIONS)[number]["id"];

const OPEN_TO_IDS = new Set<string>(OPEN_TO_OPTIONS.map((option) => option.id));

export function isOpenToStatus(value: string): value is OpenToStatus {
  return OPEN_TO_IDS.has(value);
}

export function openToLabel(status: OpenToStatus): string {
  return OPEN_TO_OPTIONS.find((option) => option.id === status)?.label ?? status;
}

/** "none" is an explicit opt-out, same as unset — neither gets a header CTA. */
export function shouldShowOpenToCta(status: OpenToStatus | null): status is Exclude<
  OpenToStatus,
  "none"
> {
  return status !== null && status !== "none";
}

const OPEN_TO_CTA_COPY: Record<Exclude<OpenToStatus, "none">, string> = {
  work: "Open to work",
  collaboration: "Open to collaboration",
  mentoring: "Open to mentoring",
};

export function openToCtaLabel(status: Exclude<OpenToStatus, "none">): string {
  return OPEN_TO_CTA_COPY[status];
}
