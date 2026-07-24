/** Decoding Bitcoin (bitcoindevs.xyz/decoding) — interactive companion labs for Pull. */

export const DECODING_BITCOIN_ORIGIN = "https://bitcoindevs.xyz/decoding";

export function buildDecodingBitcoinUrl(slug: string): string {
  const trimmed = slug.replace(/^\/+|\/+$/g, "");
  return `${DECODING_BITCOIN_ORIGIN}/${trimmed}`;
}

/** Curated deep-links used across lesson frontmatter. */
export const DECODING = {
  home: DECODING_BITCOIN_ORIGIN,
  // Modules / topic hubs
  transactions: buildDecodingBitcoinUrl("transaction-lifecycle"),
  transactionStructure: buildDecodingBitcoinUrl("transaction-structure"),
  transactionExercises: buildDecodingBitcoinUrl("transaction_exercises"),
  utxo: buildDecodingBitcoinUrl("utxo"),
  scriptsOverview: buildDecodingBitcoinUrl("locking-unlocking"),
  p2pk: buildDecodingBitcoinUrl("p2pk"),
  p2pkh: buildDecodingBitcoinUrl("p2pkh"),
  p2sh: buildDecodingBitcoinUrl("p2sh"),
  p2ms: buildDecodingBitcoinUrl("p2ms"),
  scriptProject: buildDecodingBitcoinUrl("project"),
  taproot: buildDecodingBitcoinUrl("introduction-taproot"),
  taprootRoadmap: buildDecodingBitcoinUrl("taproot-roadmap"),
  schnorr: buildDecodingBitcoinUrl("schnorr-signature"),
  taggedHashes: buildDecodingBitcoinUrl("tagged-hashes"),
  // Tools
  transactionDecoder: buildDecodingBitcoinUrl("transaction-decoder"),
  reorgCalculator: buildDecodingBitcoinUrl("reorg-calculator"),
  hashFunctions: buildDecodingBitcoinUrl("hash-functions"),
} as const;

/** SHA-256 visualizer from Bitcoin Dev Project (companion to Decoding hash tool). */
export const HASHES_VISUALIZER_URL = "https://hashexplained.com";
