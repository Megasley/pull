const GITHUB_REPO_PATTERN =
  /^https:\/\/(www\.)?github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+(\.git)?\/?$/;

const GITHUB_PR_PATTERN =
  /^https:\/\/(www\.)?github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/pull\/\d+\/?$/;

export const MAX_SCREENSHOTS = 8;
export const MAX_URL_LENGTH = 2048;

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function normalizeOptionalUrl(value: string | undefined | null): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed.replace(/\/$/, "") : null;
}

export function parseScreenshotUrls(raw: string | string[] | undefined): string[] {
  if (!raw) {
    return [];
  }

  const lines = Array.isArray(raw) ? raw : raw.split(/\r?\n/);

  const unique = new Set<string>();
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    const normalized = line.replace(/\/$/, "");
    if (normalized.length > MAX_URL_LENGTH) continue;
    unique.add(normalized);
    if (unique.size >= MAX_SCREENSHOTS) break;
  }

  return [...unique];
}

export type SubmissionValidationResult =
  | {
      ok: true;
      data: {
        repoUrl: string | null;
        prUrl: string | null;
        liveDemoUrl: string | null;
        videoDemoUrl: string | null;
        screenshotUrls: string[];
        notes: string;
      };
    }
  | { ok: false; error: string };

export function validateSubmissionInput(
  input: {
    repoUrl?: string;
    prUrl?: string;
    liveDemoUrl?: string;
    videoDemoUrl?: string;
    screenshotUrls?: string | string[];
    notes?: string;
  },
  options: { requireRepo: boolean },
): SubmissionValidationResult {
  const repoUrl = normalizeOptionalUrl(input.repoUrl);
  const prUrl = normalizeOptionalUrl(input.prUrl);
  const liveDemoUrl = normalizeOptionalUrl(input.liveDemoUrl);
  const videoDemoUrl = normalizeOptionalUrl(input.videoDemoUrl);
  const notes = input.notes?.trim() ?? "";

  const rawLines: string[] = !input.screenshotUrls
    ? []
    : Array.isArray(input.screenshotUrls)
      ? input.screenshotUrls
      : input.screenshotUrls.split(/\r?\n/);
  const trimmedLines = rawLines.map((l) => l.trim()).filter(Boolean);

  if (trimmedLines.length > MAX_SCREENSHOTS) {
    return {
      ok: false,
      error: `Too many screenshots. At most ${MAX_SCREENSHOTS} screenshot URLs may be provided.`,
    };
  }

  for (const line of trimmedLines) {
    if (line.length > MAX_URL_LENGTH) {
      return {
        ok: false,
        error: `Screenshot URL exceeds ${MAX_URL_LENGTH} characters: ${line.slice(0, 80)}…`,
      };
    }
  }

  const screenshotUrls = parseScreenshotUrls(input.screenshotUrls);

  if (options.requireRepo && !repoUrl) {
    return { ok: false, error: "A GitHub repository URL is required to submit." };
  }

  if (repoUrl && !GITHUB_REPO_PATTERN.test(repoUrl)) {
    return {
      ok: false,
      error:
        "Repository must be a valid GitHub URL like https://github.com/owner/repo.",
    };
  }

  if (prUrl && !GITHUB_PR_PATTERN.test(prUrl)) {
    return {
      ok: false,
      error:
        "Pull request must be a valid GitHub PR URL like https://github.com/owner/repo/pull/1.",
    };
  }

  if (liveDemoUrl && !isHttpUrl(liveDemoUrl)) {
    return { ok: false, error: "Live demo must be a valid http(s) URL." };
  }

  if (videoDemoUrl && !isHttpUrl(videoDemoUrl)) {
    return { ok: false, error: "Video demo must be a valid http(s) URL." };
  }

  for (const screenshot of screenshotUrls) {
    if (!isHttpUrl(screenshot)) {
      return {
        ok: false,
        error: `Screenshot URL is invalid: ${screenshot}`,
      };
    }
  }

  if (notes.length > 5000) {
    return { ok: false, error: "Notes must be 5000 characters or fewer." };
  }

  return {
    ok: true,
    data: {
      repoUrl,
      prUrl,
      liveDemoUrl,
      videoDemoUrl,
      screenshotUrls,
      notes,
    },
  };
}
