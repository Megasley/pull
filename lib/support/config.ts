export function getOnchainAddress(): string | null {
  return process.env.NEXT_PUBLIC_ONCHAIN_ADDRESS?.trim() || null;
}

export function getSilentPaymentAddress(): string | null {
  return process.env.NEXT_PUBLIC_SILENT_PAYMENT_ADDRESS?.trim() || null;
}

export type SupportPublicConfig = {
  onchainAddress: string | null;
  silentPaymentAddress: string | null;
  lightningEnabled: boolean;
};

export function getSupportPublicConfig(lightningEnabled: boolean): SupportPublicConfig {
  return {
    onchainAddress: getOnchainAddress(),
    silentPaymentAddress: getSilentPaymentAddress(),
    lightningEnabled,
  };
}
