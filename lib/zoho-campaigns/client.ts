import {
  getZohoAccountsDomain,
  getZohoCampaignsApiDomain,
  getZohoCampaignsListKey,
  getZohoClientId,
  getZohoClientSecret,
  getZohoRefreshToken,
  isZohoCampaignsConfigured,
} from "@/lib/zoho-campaigns/env";

/** Scopes the Self Client grant code must include (see scripts/zoho-campaigns-setup.ts). */
export const ZOHO_CAMPAIGNS_SCOPES = [
  "ZohoCampaigns.contact.UPDATE", // listsubscribe
  "ZohoCampaigns.contact.READ", // getmailinglists (setup only)
] as const;

// Zoho answers a token without the right Campaigns scope with its HTML
// sign-in page (HTTP 200), not a JSON error. Say so plainly instead of
// letting JSON.parse throw on the markup.
async function readJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    const html = /^\s*</.test(text);
    throw new Error(
      html
        ? `Zoho returned an HTML page instead of JSON (HTTP ${response.status}). The refresh token is most likely missing a scope — it needs ${ZOHO_CAMPAIGNS_SCOPES.join(",")}.`
        : `Zoho returned a non-JSON response (HTTP ${response.status}): ${text.slice(0, 200)}`,
    );
  }
}

type CachedToken = { accessToken: string; expiresAt: number };

// Module-scope cache: Fluid Compute reuses instances across requests, so this
// avoids a token refresh round-trip on every signup. Falls back to a fresh
// refresh whenever it's missing or within 60s of expiry.
let cachedToken: CachedToken | null = null;

/** Test hook: forget the cached access token. */
export function resetZohoTokenCache(): void {
  cachedToken = null;
}

async function getAccessToken(): Promise<CachedToken> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken;
  }

  const clientId = getZohoClientId();
  const clientSecret = getZohoClientSecret();
  const refreshToken = getZohoRefreshToken();
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Zoho Campaigns is not configured.");
  }

  const response = await fetch(`${getZohoAccountsDomain()}/oauth/v2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    }),
    cache: "no-store",
  });

  const payload = await readJson<{
    access_token?: string;
    expires_in?: number;
    error?: string;
  }>(response);

  if (!response.ok || !payload.access_token) {
    throw new Error(
      payload.error || `Zoho token refresh failed (HTTP ${response.status}).`,
    );
  }

  cachedToken = {
    accessToken: payload.access_token,
    expiresAt: Date.now() + ((payload.expires_in ?? 3600) - 60) * 1000,
  };
  return cachedToken;
}

/**
 * Subscribes an email to the configured Zoho Campaigns list. Lists with a
 * signup form enabled send a confirmation email first (double opt-in).
 */
export async function subscribeToZohoCampaignsList(
  email: string,
  { source = "pullos.dev", firstName }: { source?: string; firstName?: string } = {},
): Promise<void> {
  if (!isZohoCampaignsConfigured()) {
    throw new Error("Zoho Campaigns is not configured.");
  }
  const listKey = getZohoCampaignsListKey()!;

  const { accessToken } = await getAccessToken();

  const response = await fetch(
    `${getZohoCampaignsApiDomain()}/api/v1.1/json/listsubscribe`,
    {
      method: "POST",
      headers: {
        Authorization: `Zoho-oauthtoken ${accessToken}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        resfmt: "JSON",
        listkey: listKey,
        // Field names match Zoho's default contact fields; First Name feeds
        // the $[FNAME]$ merge tag in emails.
        contactinfo: JSON.stringify({
          "Contact Email": email,
          ...(firstName ? { "First Name": firstName } : {}),
        }),
        source,
      }),
      cache: "no-store",
    },
  );

  const payload = await readJson<{ status?: string; message?: string; code?: string }>(
    response,
  );

  if (!response.ok || payload.status !== "success") {
    // A rejected token: drop it so the next attempt refreshes.
    if (response.status === 401) cachedToken = null;
    throw new Error(
      payload.message ||
        `Zoho Campaigns subscribe failed (HTTP ${response.status}${payload.code ? `, code ${payload.code}` : ""}).`,
    );
  }
}

export type ZohoMailingList = { listkey: string; listname: string };

/** Lists mailing lists, so setup can find ZOHO_CAMPAIGNS_LIST_KEY. */
export async function listZohoCampaignsMailingLists(): Promise<ZohoMailingList[]> {
  const { accessToken } = await getAccessToken();
  const params = new URLSearchParams({
    resfmt: "JSON",
    sort: "asc",
    fromindex: "1",
    range: "100",
  });

  const response = await fetch(
    `${getZohoCampaignsApiDomain()}/api/v1.1/getmailinglists?${params}`,
    {
      headers: { Authorization: `Zoho-oauthtoken ${accessToken}` },
      cache: "no-store",
    },
  );

  const payload = await readJson<{
    status?: string;
    message?: string;
    list_of_details?: ZohoMailingList[];
  }>(response);

  if (!response.ok || payload.status !== "success") {
    throw new Error(
      payload.message || `Zoho list lookup failed (HTTP ${response.status}).`,
    );
  }
  return (payload.list_of_details ?? []).map(({ listkey, listname }) => ({
    listkey,
    listname,
  }));
}

/** One-time setup: trade a Self Client grant code for a refresh token. */
export async function exchangeZohoGrantCode(code: string): Promise<string> {
  const clientId = getZohoClientId();
  const clientSecret = getZohoClientSecret();
  if (!clientId || !clientSecret) {
    throw new Error("Set ZOHO_CLIENT_ID and ZOHO_CLIENT_SECRET first.");
  }

  const response = await fetch(`${getZohoAccountsDomain()}/oauth/v2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: clientId,
      client_secret: clientSecret,
      code,
    }),
    cache: "no-store",
  });

  const payload = await readJson<{ refresh_token?: string; error?: string }>(response);
  if (!response.ok || !payload.refresh_token) {
    throw new Error(
      payload.error === "invalid_code"
        ? "Zoho rejected the code: it's wrong, already used, or expired. Generate a new one."
        : payload.error || `Zoho code exchange failed (HTTP ${response.status}).`,
    );
  }
  return payload.refresh_token;
}
