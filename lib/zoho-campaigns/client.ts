import {
  getZohoAccountsDomain,
  getZohoCampaignsApiDomain,
  getZohoCampaignsListKey,
  getZohoClientId,
  getZohoClientSecret,
  getZohoRefreshToken,
  isZohoCampaignsConfigured,
} from "@/lib/zoho-campaigns/env";

// Zoho returns HTML (not JSON) on gateway-level auth failures (e.g. a token
// missing the required scope) — surface those as a readable error instead of
// letting JSON.parse throw on the "<!doctype html>..." body.
async function readJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`Zoho returned a non-JSON response (HTTP ${response.status}): ${text.slice(0, 200)}`);
  }
}

type CachedToken = { accessToken: string; expiresAt: number };

// Module-scope cache: Fluid Compute reuses instances across requests, so this
// avoids a token refresh round-trip on every signup. Falls back to a fresh
// refresh whenever it's missing or within 60s of expiry.
let cachedToken: CachedToken | null = null;

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

  const params = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
  });

  const response = await fetch(`${getZohoAccountsDomain()}/oauth/v2/token?${params}`, {
    method: "POST",
    cache: "no-store",
  });

  const payload = await readJson<{
    access_token?: string;
    expires_in?: number;
    error?: string;
  }>(response);

  if (!response.ok || !payload.access_token) {
    throw new Error(payload.error || `Zoho token refresh failed (HTTP ${response.status}).`);
  }

  cachedToken = {
    accessToken: payload.access_token,
    expiresAt: Date.now() + ((payload.expires_in ?? 3600) - 60) * 1000,
  };
  return cachedToken;
}

/** Subscribes an email to the configured Zoho Campaigns list (double opt-in). */
export async function subscribeToZohoCampaignsList(email: string): Promise<void> {
  if (!isZohoCampaignsConfigured()) {
    throw new Error("Zoho Campaigns is not configured.");
  }
  const listKey = getZohoCampaignsListKey()!;

  const { accessToken } = await getAccessToken();

  const params = new URLSearchParams({
    resfmt: "JSON",
    listkey: listKey,
    contactinfo: JSON.stringify({ "Contact Email": email }),
    source: "pullos.dev footer",
  });

  const response = await fetch(
    `${getZohoCampaignsApiDomain()}/api/v1.1/json/listsubscribe?${params}`,
    {
      method: "POST",
      headers: { Authorization: `Zoho-oauthtoken ${accessToken}` },
      cache: "no-store",
    },
  );

  const payload = await readJson<{ status?: string; message?: string }>(response);

  if (!response.ok || payload.status !== "success") {
    throw new Error(payload.message || `Zoho Campaigns subscribe failed (HTTP ${response.status}).`);
  }
}
