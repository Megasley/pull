/**
 * Attribution registry for third-party works referenced by the curriculum.
 *
 * Pull links to these works; it does not redistribute them. Licenses listed
 * here describe the upstream work, not Pull's own MIT-licensed application code.
 */

export const PULL_SOFTWARE_LICENSE = {
  spdx: "MIT",
  href: "https://github.com/Megasley/pull/blob/main/LICENSE",
} as const;

export const PULL_CURRICULUM_LICENSE = {
  spdx: "CC BY-SA 4.0",
  href: "https://creativecommons.org/licenses/by-sa/4.0/",
} as const;

export type Attribution = {
  name: string;
  href: string;
  /** Authors, maintainers, or stewarding organisation. */
  authors: string;
  /** Upstream license as published by the work itself. */
  license: string;
  licenseHref?: string;
  /** How Pull uses the work — always link-out, never redistribution. */
  usage: string;
};

export type AttributionGroup = {
  id: string;
  title: string;
  description: string;
  items: readonly Attribution[];
};

export const attributionGroups = [
  {
    id: "books",
    title: "Books",
    description:
      "Required reading in lessons links to the freely licensed source repositories. Pull writes its own summaries and does not reproduce book text.",
    items: [
      {
        name: "Mastering Bitcoin",
        href: "https://github.com/bitcoinbook/bitcoinbook",
        authors: "Andreas M. Antonopoulos, David A. Harding, and contributors",
        license: "CC BY-SA 4.0 (tagged print editions)",
        licenseHref: "https://github.com/bitcoinbook/bitcoinbook/blob/develop/LICENSE",
        usage: "Chapter deep links as required reading on Bitcoin roadmap lessons.",
      },
      {
        name: "Mastering the Lightning Network",
        href: "https://github.com/lnbook/lnbook",
        authors:
          "Andreas M. Antonopoulos, Olaoluwa Osuntokun, René Pickhardt, and contributors",
        license: "CC BY-SA 4.0",
        licenseHref: "https://github.com/lnbook/lnbook/blob/develop/LICENSE.md",
        usage: "Chapter deep links as required reading on Lightning roadmap lessons.",
      },
    ],
  },
  {
    id: "specifications",
    title: "Specifications",
    description:
      "Normative references. Lessons explain the specs in Pull's own words and link to the canonical text.",
    items: [
      {
        name: "Bitcoin Improvement Proposals (BIPs)",
        href: "https://github.com/bitcoin/bips",
        authors: "BIP authors and editors",
        license: "Per-BIP — each proposal declares its own license",
        licenseHref: "https://github.com/bitcoin/bips/blob/master/bip-0002.mediawiki",
        usage: "Normative references on protocol lessons.",
      },
      {
        name: "Lightning BOLTs",
        href: "https://github.com/lightning/bolts",
        authors: "Lightning protocol contributors",
        license: "CC BY 4.0",
        licenseHref: "https://creativecommons.org/licenses/by/4.0/",
        usage: "Normative references on Lightning lessons.",
      },
      {
        name: "LNURL specifications (LUDs)",
        href: "https://github.com/lnurl/luds",
        authors: "LNURL contributors",
        license: "See upstream repository",
        usage: "Reference material for LNURL and payment UX lessons.",
      },
    ],
  },
  {
    id: "implementations",
    title: "Implementations and libraries",
    description:
      "Software users install or read while completing labs and projects. Each project stays under its own license.",
    items: [
      {
        name: "Bitcoin Core",
        href: "https://github.com/bitcoin/bitcoin",
        authors: "The Bitcoin Core developers",
        license: "MIT",
        licenseHref: "https://github.com/bitcoin/bitcoin/blob/master/COPYING",
        usage: "Regtest labs, RPC references, and contribution lessons.",
      },
      {
        name: "LND",
        href: "https://github.com/lightningnetwork/lnd",
        authors: "Lightning Labs and the Lightning Network developers",
        license: "MIT",
        licenseHref: "https://github.com/lightningnetwork/lnd/blob/master/LICENSE",
        usage: "Lightning node labs and implementation lessons.",
      },
      {
        name: "Core Lightning (CLN)",
        href: "https://github.com/ElementsProject/lightning",
        authors: "Blockstream and Core Lightning contributors",
        license: "BSD-MIT",
        licenseHref: "https://github.com/ElementsProject/lightning/blob/master/LICENSE",
        usage: "Lightning node labs and implementation lessons.",
      },
      {
        name: "Lightning Dev Kit (LDK)",
        href: "https://github.com/lightningdevkit/rust-lightning",
        authors: "LDK contributors",
        license: "Apache-2.0 OR MIT",
        licenseHref: "https://github.com/lightningdevkit/rust-lightning#license",
        usage: "Embedded Lightning lessons and project starters.",
      },
      {
        name: "Bitcoin Dev Kit (BDK)",
        href: "https://github.com/bitcoindevkit/bdk",
        authors: "BDK contributors",
        license: "Apache-2.0 OR MIT",
        licenseHref: "https://github.com/bitcoindevkit/bdk#license",
        usage: "Wallet and descriptor projects.",
      },
      {
        name: "rust-bitcoin",
        href: "https://github.com/rust-bitcoin/rust-bitcoin",
        authors: "rust-bitcoin contributors",
        license: "CC0-1.0",
        licenseHref: "https://github.com/rust-bitcoin/rust-bitcoin/blob/master/LICENSE",
        usage: "Library reference in Rust-based projects.",
      },
      {
        name: "bitcoinjs-lib",
        href: "https://github.com/bitcoinjs/bitcoinjs-lib",
        authors: "bitcoinjs contributors",
        license: "MIT",
        licenseHref: "https://github.com/bitcoinjs/bitcoinjs-lib/blob/master/LICENSE",
        usage: "Library reference in JavaScript/TypeScript projects.",
      },
    ],
  },
  {
    id: "learning",
    title: "Learning resources and tools",
    description:
      "Companion material Pull links to from study plans. None of it is forked, mirrored, or embedded.",
    items: [
      {
        name: "Decoding Bitcoin — Bitcoin Dev Project",
        href: "https://bitcoindevs.xyz/decoding",
        authors: "Bitcoin Dev Project",
        license: "See upstream site and repositories",
        licenseHref: "https://github.com/bitcoin-dev-project",
        usage:
          "Interactive lab deep links (`kind: interactive` resources). Pull does not host or copy these labs.",
      },
      {
        name: "Bitcoin Search",
        href: "https://bitcoinsearch.xyz",
        authors: "Bitcoin Dev Project",
        license: "See upstream site",
        usage: "Generated deep-research query links on lessons.",
      },
      {
        name: "Bitcoin Optech",
        href: "https://bitcoinops.org",
        authors: "Bitcoin Optech contributors",
        license: "See upstream site",
        usage: "Topic pages and newsletter references in study plans.",
      },
      {
        name: "Bitcoin developer documentation",
        href: "https://developer.bitcoin.org",
        authors: "Bitcoin developer documentation contributors",
        license: "See upstream site",
        usage: "RPC and reference links in lessons and labs.",
      },
      {
        name: "Polar",
        href: "https://lightningpolar.com",
        authors: "Jamal Jackson and contributors",
        license: "MIT",
        licenseHref: "https://github.com/jamaljsr/polar/blob/master/LICENSE",
        usage: "Local Lightning network setup for labs.",
      },
      {
        name: "mempool.space",
        href: "https://mempool.space",
        authors: "mempool.space contributors",
        license: "See upstream repository",
        licenseHref: "https://github.com/mempool/mempool",
        usage: "Fee and transaction exploration in labs.",
      },
    ],
  },
] as const satisfies readonly AttributionGroup[];

/** Every source in one flat list (docs generation, tests, audits). */
export function listAttributions(): Attribution[] {
  return attributionGroups.flatMap((group) => [...group.items]);
}
