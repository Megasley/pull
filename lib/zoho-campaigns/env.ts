/** Zoho Campaigns env (server-only; the refresh token never reaches the client). */

export function getZohoAccountsDomain(): string {
  return process.env.ZOHO_ACCOUNTS_DOMAIN?.trim() || "https://accounts.zoho.com";
}

// Campaigns' REST API lives at its own dedicated host, not the generic
// api_domain Zoho's OAuth token response returns (that one 404s for Campaigns
// endpoints) — see lib/zoho-campaigns/client.ts.
export function getZohoCampaignsApiDomain(): string {
  return process.env.ZOHO_CAMPAIGNS_API_DOMAIN?.trim() || "https://campaigns.zoho.com";
}

export function getZohoClientId(): string | null {
  return process.env.ZOHO_CLIENT_ID?.trim() || null;
}

export function getZohoClientSecret(): string | null {
  return process.env.ZOHO_CLIENT_SECRET?.trim() || null;
}

export function getZohoRefreshToken(): string | null {
  return process.env.ZOHO_REFRESH_TOKEN?.trim() || null;
}

export function getZohoCampaignsListKey(): string | null {
  return process.env.ZOHO_CAMPAIGNS_LIST_KEY?.trim() || null;
}

export function isZohoCampaignsConfigured(): boolean {
  return Boolean(
    getZohoClientId() &&
      getZohoClientSecret() &&
      getZohoRefreshToken() &&
      getZohoCampaignsListKey(),
  );
}
