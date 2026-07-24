import type { RoadmapDifficulty } from "@/types";

export type LandingRoadmap = {
  slug: string;
  title: string;
  description: string;
  difficulty: RoadmapDifficulty;
  duration: string;
  projectCount: number;
  status: "available" | "coming-soon";
  prerequisite?: string;
};

export const availableRoadmaps: LandingRoadmap[] = [
  {
    slug: "bitcoin",
    title: "Bitcoin",
    description:
      "Master UTXOs, scripts, wallets, and your first meaningful Bitcoin open source contributions.",
    difficulty: "beginner",
    duration: "24 weeks",
    projectCount: 29,
    status: "available",
  },
  {
    slug: "lightning",
    title: "Lightning",
    description:
      "Build on LND, Core Lightning, and LDK - from channels and invoices to routing and liquidity.",
    difficulty: "intermediate",
    duration: "20 weeks",
    projectCount: 26,
    status: "available",
    prerequisite: "Complete the Bitcoin roadmap to unlock",
  },
];

export const comingSoonRoadmaps: LandingRoadmap[] = [
  {
    slug: "rust",
    title: "Rust",
    description:
      "Systems programming for Bitcoin infrastructure and protocol development.",
    difficulty: "intermediate",
    duration: "14 weeks",
    projectCount: 10,
    status: "coming-soon",
  },
  {
    slug: "nostr",
    title: "Nostr",
    description: "Decentralized social protocols, relays, and client development.",
    difficulty: "intermediate",
    duration: "10 weeks",
    projectCount: 8,
    status: "coming-soon",
  },
  {
    slug: "fedimint",
    title: "Fedimint",
    description: "Community custody, federation software, and Chaumian e-cash systems.",
    difficulty: "advanced",
    duration: "12 weeks",
    projectCount: 7,
    status: "coming-soon",
  },
  {
    slug: "cashu",
    title: "Cashu",
    description:
      "Chaumian ecash mints, wallets, and Lightning-backed bearer tokens for private payments.",
    difficulty: "intermediate",
    duration: "10 weeks",
    projectCount: 8,
    status: "coming-soon",
  },
  {
    slug: "ark",
    title: "Ark",
    description: "Virtual UTXO protocols and off-chain scaling experiments.",
    difficulty: "advanced",
    duration: "10 weeks",
    projectCount: 6,
    status: "coming-soon",
  },
  {
    slug: "bitcoin-core",
    title: "Bitcoin Core",
    description:
      "Contribute to the reference implementation and consensus-critical code.",
    difficulty: "advanced",
    duration: "20 weeks",
    projectCount: 8,
    status: "coming-soon",
  },
  {
    slug: "wallet-development",
    title: "Wallet Development",
    description: "Design secure key management, PSBT flows, and production wallet UX.",
    difficulty: "intermediate",
    duration: "12 weeks",
    projectCount: 11,
    status: "coming-soon",
  },
  {
    slug: "distributed-systems",
    title: "Distributed Systems",
    description:
      "Networking, replication, and reliability patterns for open protocols.",
    difficulty: "advanced",
    duration: "14 weeks",
    projectCount: 9,
    status: "coming-soon",
  },
  {
    slug: "cryptography",
    title: "Cryptography",
    description: "Elliptic curves, Schnorr signatures, and protocol-level security.",
    difficulty: "advanced",
    duration: "16 weeks",
    projectCount: 10,
    status: "coming-soon",
  },
  {
    slug: "bitvm",
    title: "BitVM",
    description:
      "Optimistic verification and advanced Bitcoin programmability research.",
    difficulty: "advanced",
    duration: "12 weeks",
    projectCount: 5,
    status: "coming-soon",
  },
];
