/** Bitcoin Search (bitcoinsearch.xyz) — deep-research layer for lessons. */
export const BITCOIN_SEARCH_ORIGIN = "https://bitcoinsearch.xyz";

export function buildBitcoinSearchUrl(query: string): string {
  const trimmed = query.trim();
  const url = new URL(BITCOIN_SEARCH_ORIGIN);
  if (trimmed) {
    url.searchParams.set("search", trimmed);
  }
  return url.toString();
}

export function resolveLessonSearchQuery(
  queries: string[],
  fallbackTitle?: string,
): string {
  const first = queries.map((item) => item.trim()).find(Boolean);
  if (first) {
    return first;
  }

  return fallbackTitle?.trim() ?? "";
}
