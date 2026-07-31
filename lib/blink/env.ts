/** Blink receive-only env (API key never exposed to the client). */

export function getBlinkApiUrl(): string {
  return (
    process.env.BLINK_API_URL?.trim() || "https://api.blink.sv/graphql"
  );
}

export function getBlinkApiKey(): string | null {
  return process.env.BLINK_API_KEY?.trim() || null;
}

export function getBlinkWalletId(): string | null {
  return process.env.BLINK_WALLET_ID?.trim() || null;
}

export function isBlinkReceiveConfigured(): boolean {
  return Boolean(getBlinkApiKey() && getBlinkWalletId());
}
