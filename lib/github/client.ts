import {
  GITHUB_API_BASE,
  GITHUB_GRAPHQL_URL,
  GITHUB_USER_AGENT,
} from "./config";

export class GithubApiError extends Error {
  status: number;
  rateLimitRemaining: number | null;
  rateLimitReset: number | null;
  retryable: boolean;

  constructor(
    message: string,
    options: {
      status: number;
      rateLimitRemaining?: number | null;
      rateLimitReset?: number | null;
      retryable?: boolean;
    },
  ) {
    super(message);
    this.name = "GithubApiError";
    this.status = options.status;
    this.rateLimitRemaining = options.rateLimitRemaining ?? null;
    this.rateLimitReset = options.rateLimitReset ?? null;
    this.retryable = options.retryable ?? false;
  }
}

type RequestOptions = {
  method?: "GET" | "POST";
  body?: unknown;
  accept?: string;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseLinkNext(linkHeader: string | null): string | null {
  if (!linkHeader) return null;
  for (const part of linkHeader.split(",")) {
    const match = part.match(/<([^>]+)>;\s*rel="next"/);
    if (match?.[1]) return match[1];
  }
  return null;
}

export class GithubClient {
  constructor(private readonly accessToken: string) {}

  async request<T>(pathOrUrl: string, options: RequestOptions = {}): Promise<T> {
    const url = pathOrUrl.startsWith("http")
      ? pathOrUrl
      : `${GITHUB_API_BASE}${pathOrUrl}`;

    return this.withRetries(async () => {
      const response = await fetch(url, {
        method: options.method ?? "GET",
        headers: {
          Accept: options.accept ?? "application/vnd.github+json",
          Authorization: `Bearer ${this.accessToken}`,
          "User-Agent": GITHUB_USER_AGENT,
          "X-GitHub-Api-Version": "2022-11-28",
          ...(options.body ? { "Content-Type": "application/json" } : {}),
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
      });

      const remaining = Number(response.headers.get("x-ratelimit-remaining"));
      const reset = Number(response.headers.get("x-ratelimit-reset"));

      if (response.status === 403 || response.status === 429) {
        const retryAfter = Number(response.headers.get("retry-after"));
        throw new GithubApiError(
          `GitHub rate limit or forbidden (${response.status})`,
          {
            status: response.status,
            rateLimitRemaining: Number.isFinite(remaining) ? remaining : null,
            rateLimitReset: Number.isFinite(reset) ? reset : null,
            retryable: true,
          },
        );
      }

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new GithubApiError(
          `GitHub API ${response.status}: ${text.slice(0, 200) || response.statusText}`,
          {
            status: response.status,
            rateLimitRemaining: Number.isFinite(remaining) ? remaining : null,
            rateLimitReset: Number.isFinite(reset) ? reset : null,
            retryable: response.status >= 500,
          },
        );
      }

      if (response.status === 204) {
        return undefined as T;
      }

      return (await response.json()) as T;
    });
  }

  async requestPaginated<T>(
    path: string,
    options: { maxPages?: number; perPage?: number } = {},
  ): Promise<T[]> {
    const maxPages = options.maxPages ?? 10;
    const perPage = options.perPage ?? 100;
    const separator = path.includes("?") ? "&" : "?";
    let nextUrl: string | null =
      `${GITHUB_API_BASE}${path}${separator}per_page=${perPage}`;
    const items: T[] = [];
    let page = 0;

    while (nextUrl && page < maxPages) {
      page += 1;
      const result = await this.withRetries(async () => {
        const response = await fetch(nextUrl!, {
          headers: {
            Accept: "application/vnd.github+json",
            Authorization: `Bearer ${this.accessToken}`,
            "User-Agent": GITHUB_USER_AGENT,
            "X-GitHub-Api-Version": "2022-11-28",
          },
        });

        const remaining = Number(response.headers.get("x-ratelimit-remaining"));
        const reset = Number(response.headers.get("x-ratelimit-reset"));

        if (response.status === 403 || response.status === 429) {
          throw new GithubApiError("GitHub rate limit while paginating", {
            status: response.status,
            rateLimitRemaining: Number.isFinite(remaining) ? remaining : null,
            rateLimitReset: Number.isFinite(reset) ? reset : null,
            retryable: true,
          });
        }

        if (!response.ok) {
          const text = await response.text().catch(() => "");
          throw new GithubApiError(
            `GitHub API ${response.status}: ${text.slice(0, 200)}`,
            {
              status: response.status,
              retryable: response.status >= 500,
            },
          );
        }

        const data = (await response.json()) as T[];
        return {
          data,
          next: parseLinkNext(response.headers.get("link")),
        };
      });

      items.push(...result.data);
      nextUrl = result.next;
    }

    return items;
  }

  async graphql<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
    return this.withRetries(async () => {
      const response = await fetch(GITHUB_GRAPHQL_URL, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${this.accessToken}`,
          "User-Agent": GITHUB_USER_AGENT,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query, variables }),
      });

      if (response.status === 403 || response.status === 429) {
        const remaining = Number(response.headers.get("x-ratelimit-remaining"));
        const reset = Number(response.headers.get("x-ratelimit-reset"));
        throw new GithubApiError("GitHub GraphQL rate limit", {
          status: response.status,
          rateLimitRemaining: Number.isFinite(remaining) ? remaining : null,
          rateLimitReset: Number.isFinite(reset) ? reset : null,
          retryable: true,
        });
      }

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new GithubApiError(
          `GitHub GraphQL ${response.status}: ${text.slice(0, 200)}`,
          {
            status: response.status,
            retryable: response.status >= 500,
          },
        );
      }

      const payload = (await response.json()) as {
        data?: T;
        errors?: Array<{ message: string }>;
      };

      if (payload.errors?.length) {
        throw new GithubApiError(payload.errors[0]?.message ?? "GraphQL error", {
          status: 200,
          retryable: false,
        });
      }

      if (!payload.data) {
        throw new GithubApiError("GraphQL response missing data", {
          status: 200,
          retryable: false,
        });
      }

      return payload.data;
    });
  }

  private async withRetries<T>(
    fn: () => Promise<T>,
    attempts = 4,
  ): Promise<T> {
    let lastError: unknown;

    for (let attempt = 0; attempt < attempts; attempt += 1) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        if (!(error instanceof GithubApiError) || !error.retryable) {
          throw error;
        }

        if (attempt === attempts - 1) break;

        let waitMs = 500 * 2 ** attempt;

        if (error.rateLimitReset) {
          const untilReset = error.rateLimitReset * 1000 - Date.now();
          if (untilReset > 0) {
            waitMs = Math.min(untilReset + 250, 60_000);
          }
        }

        await sleep(waitMs);
      }
    }

    throw lastError;
  }
}
