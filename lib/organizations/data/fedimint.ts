import type { OrganizationProfile } from "@/lib/organizations/types";

export const fedimintOrganization: OrganizationProfile = {
  slug: "fedimint",
  name: "Fedimint",
  tagline:
    "Fedimint is an open source protocol enabling communities to custody and transact Bitcoin collaboratively using federated mints.",
  description:
    "Fedimint lets communities run federated Bitcoin mints — sharing custody across trusted guardians while keeping users in control of their balances. Contributors work across protocol, gateway, UX, docs, and tooling to make community custody practical.",
  mission:
    "Make collaborative Bitcoin custody accessible, auditable, and developer-friendly — so communities can hold and move value without relying on a single custodian.",
  whyContribute: [
    "Ship real protocol work that touches Bitcoin custody, Lightning gateways, and client SDKs.",
    "Join a mentorship-friendly Rust codebase with clear modules and active maintainers.",
    "Help privacy-preserving community banking reach builders worldwide.",
    "Grow alongside Pull’s contributor journey — from docs to first PR to protocol depth.",
  ],
  website: "https://fedimint.org",
  github: "https://github.com/fedimint/fedimint",
  communityInvite: "https://t.me/fedimint",
  verified: false,
  claimed: false,
  lastUpdated: "August 2026",
  communityNotice:
    "This profile is maintained by Pull using publicly available information to help developers discover projects, learning resources, and contribution opportunities. It does not imply affiliation, endorsement, or partnership with Fedimint.",
  claimNotice:
    "Are you part of the Fedimint team? Claim this profile to manage content and update contributor resources.",
  logoInitials: "FM",
  stats: [
    { label: "Repositories", value: "12+" },
    { label: "Contributors", value: "180+" },
    { label: "Open Issues", value: "64" },
    { label: "Learning Resources", value: "9" },
  ],
  journey: [
    {
      id: "beginner",
      label: "Beginner",
      summary:
        "Build the Bitcoin and Lightning foundations, then orient to Fedimint’s docs and community.",
      steps: [
        {
          title: "Learn Bitcoin Basics",
          description:
            "UTXOs, keys, and transaction lifecycle — start with Pull’s Bitcoin roadmap.",
          href: "/roadmaps/bitcoin",
        },
        {
          title: "Learn Lightning Basics",
          description:
            "Channels, invoices, and routing — prepare for gateway and payment flows.",
          href: "/roadmaps/lightning",
        },
        {
          title: "Read Fedimint Documentation",
          description:
            "Understand federations, guardians, e-cash notes, and the client model.",
          href: "https://fedimint.org/docs/",
        },
        {
          title: "Join Community",
          description:
            "Introduce yourself on Telegram or Matrix and ask about good first issues.",
          href: "https://t.me/fedimint",
        },
      ],
    },
    {
      id: "intermediate",
      label: "Intermediate",
      summary:
        "Set up the stack, explore repos, and land a first meaningful contribution.",
      steps: [
        {
          title: "Set Up Local Development Environment",
          description:
            "Clone fedimint/fedimint, install Rust tooling, and run the developer Nix/shell workflow.",
          href: "https://github.com/fedimint/fedimint#development",
        },
        {
          title: "Explore Repositories",
          description:
            "Map core, gateway, UI, and docs — pick a surface that matches your skills.",
          href: "https://github.com/fedimint",
        },
        {
          title: "Review Good First Issues",
          description:
            "Filter labeled issues and comment to claim one with a short plan.",
          href: "https://github.com/fedimint/fedimint/labels/good%20first%20issue",
        },
        {
          title: "Submit First Pull Request",
          description:
            "Start small — tests, docs, or a scoped bugfix — and iterate with review.",
          href: "https://github.com/fedimint/fedimint/pulls",
        },
      ],
    },
    {
      id: "advanced",
      label: "Advanced",
      summary: "Own deeper protocol, SDK, security, and community leadership work.",
      steps: [
        {
          title: "Protocol Development",
          description: "Consensus modules, mint operations, and federation upgrades.",
          href: "https://github.com/fedimint/fedimint",
        },
        {
          title: "SDK Contributions",
          description: "Client APIs, wallet integrations, and developer ergonomics.",
          href: "https://github.com/fedimint/fedimint",
        },
        {
          title: "Security Reviews",
          description:
            "Threat models, guardian ops hardening, and careful change review.",
        },
        {
          title: "Community Leadership",
          description:
            "Mentor newcomers, triage issues, and shape contributor onboarding.",
          href: "https://t.me/fedimint",
        },
      ],
    },
  ],
  issues: [
    {
      id: "fm-issue-1",
      title: "Improve CLI help text for federation join flow",
      repository: "fedimint/fedimint",
      difficulty: "beginner",
      labels: ["good first issue", "docs", "cli"],
      href: "https://github.com/fedimint/fedimint/issues",
    },
    {
      id: "fm-issue-2",
      title: "Add integration test coverage for gateway lightning invoice path",
      repository: "fedimint/fedimint",
      difficulty: "intermediate",
      labels: ["help wanted", "testing", "gateway"],
      href: "https://github.com/fedimint/fedimint/issues",
    },
    {
      id: "fm-issue-3",
      title: "Document guardian recovery checklist for operators",
      repository: "fedimint/fedimint",
      difficulty: "beginner",
      labels: ["good first issue", "documentation"],
      href: "https://github.com/fedimint/fedimint/issues",
    },
    {
      id: "fm-issue-4",
      title: "Harden error messages when client config is missing modules",
      repository: "fedimint/fedimint",
      difficulty: "intermediate",
      labels: ["rust", "client", "ux"],
      href: "https://github.com/fedimint/fedimint/issues",
    },
    {
      id: "fm-issue-5",
      title: "Explore UI empty states for pending peg-in transactions",
      repository: "fedimint/ui",
      difficulty: "beginner",
      labels: ["good first issue", "ui", "typescript"],
      href: "https://github.com/fedimint",
    },
    {
      id: "fm-issue-6",
      title: "Audit module API stability notes for external SDK consumers",
      repository: "fedimint/fedimint",
      difficulty: "advanced",
      labels: ["protocol", "api", "help wanted"],
      href: "https://github.com/fedimint/fedimint/issues",
    },
  ],
  projects: [
    {
      id: "core",
      name: "Fedimint Core",
      description:
        "Federated mint protocol implementation — consensus, modules, and client libraries in Rust.",
      language: "Rust",
      contributionLevel: "advanced",
      href: "https://github.com/fedimint/fedimint",
    },
    {
      id: "gateway",
      name: "Fedimint Gateway",
      description:
        "Lightning gateway bridging mint balances and LN payments for federation users.",
      language: "Rust",
      contributionLevel: "advanced",
      href: "https://github.com/fedimint/fedimint",
    },
    {
      id: "ui",
      name: "Fedimint UI",
      description:
        "Web and wallet-facing interfaces for joining federations and managing balances.",
      language: "TypeScript",
      contributionLevel: "intermediate",
      href: "https://github.com/fedimint",
    },
    {
      id: "docs",
      name: "Documentation",
      description:
        "Operator guides, contributor docs, and architecture explainers for newcomers.",
      language: "Markdown",
      contributionLevel: "beginner",
      href: "https://fedimint.org/docs/",
    },
    {
      id: "tooling",
      name: "Developer Tooling",
      description:
        "Dev shells, test harnesses, and utilities that keep federation development fast.",
      language: "Nix / Rust",
      contributionLevel: "intermediate",
      href: "https://github.com/fedimint/fedimint",
    },
  ],
  resources: [
    {
      id: "docs",
      title: "Documentation",
      description:
        "Official Fedimint docs spanning concepts, operators, and developers.",
      type: "Docs",
      href: "https://fedimint.org/docs/",
    },
    {
      id: "getting-started",
      title: "Getting Started Guide",
      description: "Spin up a local federation and make your first mint transaction.",
      type: "Guide",
      href: "https://fedimint.org/docs/",
    },
    {
      id: "architecture",
      title: "Architecture Overview",
      description: "How guardians, clients, modules, and gateways fit together.",
      type: "Overview",
      href: "https://fedimint.org/docs/",
    },
    {
      id: "tutorials",
      title: "Developer Tutorials",
      description: "Hands-on walkthroughs for contributing modules and clients.",
      type: "Tutorial",
      href: "https://github.com/fedimint/fedimint",
    },
    {
      id: "api",
      title: "API References",
      description: "Client and module interfaces for builders embedding Fedimint.",
      type: "Reference",
      href: "https://docs.rs/fedimint-core/",
    },
  ],
  opportunities: [
    {
      id: "role-docs",
      title: "Documentation steward",
      description:
        "Own contributor onboarding docs and keep good-first-issue guides current.",
      kind: "role",
      status: "open",
      href: "https://t.me/fedimint",
    },
    {
      id: "grant-ux",
      title: "Wallet UX improvement grant",
      description:
        "Funded work to improve federation join and peg-in flows for new users.",
      kind: "grant",
      status: "rolling",
      href: "https://fedimint.org",
    },
    {
      id: "bounty-tests",
      title: "Gateway test coverage bounty",
      description:
        "Expand integration tests around Lightning invoice and payment edge cases.",
      kind: "bounty",
      status: "open",
      href: "https://github.com/fedimint/fedimint/issues",
    },
    {
      id: "research-privacy",
      title: "Mint privacy research",
      description:
        "Explore note denomination and anonymity-set tradeoffs for federation operators.",
      kind: "research",
      status: "upcoming",
    },
  ],
  community: [
    {
      id: "telegram",
      name: "Telegram",
      description: "Day-to-day chat for builders, operators, and newcomers.",
      href: "https://t.me/fedimint",
    },
    {
      id: "matrix",
      name: "Matrix",
      description: "Long-form discussion and async coordination for contributors.",
      href: "https://matrix.to/#/#fedimint:matrix.org",
    },
    {
      id: "nostr",
      name: "Nostr",
      description: "Public updates and ecosystem conversation on Nostr.",
      href: "https://fedimint.org",
    },
    {
      id: "discussions",
      name: "GitHub Discussions",
      description: "Design proposals, RFCs, and contributor Q&A.",
      href: "https://github.com/fedimint/fedimint/discussions",
    },
  ],
  maintainers: [
    {
      id: "justin",
      name: "Justin Moon",
      role: "Core maintainer",
      githubUsername: "justinmoon",
      avatarUrl: "https://github.com/justinmoon.png",
    },
    {
      id: "elsirion",
      name: "elsirion",
      role: "Protocol engineer",
      githubUsername: "elsirion",
      avatarUrl: "https://github.com/elsirion.png",
    },
    {
      id: "dpc",
      name: "Dawid Ciężarkiewicz",
      role: "Core contributor",
      githubUsername: "dpc",
      avatarUrl: "https://github.com/dpc.png",
    },
    {
      id: "ok300",
      name: "ok300",
      role: "Gateway & tooling",
      githubUsername: "ok300",
      avatarUrl: "https://github.com/ok300.png",
    },
  ],
};
