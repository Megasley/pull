/**
 * Seeds a rich public demo profile at /u/satoshi for marketing and screenshots.
 *
 * Run: npm run db:seed:demo
 * Re-run safe: removes the previous satoshi row (cascade) and recreates everything.
 */
import { eq, sql } from "drizzle-orm";

import bitcoinRoadmap from "@/content/roadmaps/bitcoin.json";
import lightningRoadmap from "@/content/roadmaps/lightning.json";
import { DEMO_PROFILE_USER_ID, DEMO_PROFILE_USERNAME } from "@/lib/demo/constants";
import { getDb, resetDbClient } from "@/lib/db";
import { loadEnvLocal } from "@/lib/db/load-env";
import {
  githubCommits,
  githubContributionDays,
  githubIssues,
  githubPullRequests,
  githubRepositories,
  projectSubmissions,
  userRoadmapProgress,
  users,
  xpEvents,
} from "@/lib/db/schema";
import { ensureProjectRecord } from "@/lib/submissions/ensure-project";
import { lessonXpKey, roadmapXpKey, XP_REWARDS } from "@/lib/xp/config";
import { getUserXpTotals } from "@/lib/xp/repository";
import { syncAchievementsForUser } from "@/lib/xp/achievements";
import type { RoadmapJson } from "@/types/roadmap";

loadEnvLocal();

const DEMO_AUTH_EMAIL = "satoshi-demo@pull.local";
const BITCOIN_NODES = (bitcoinRoadmap as RoadmapJson).nodes.map((node) => node.id);
const LIGHTNING_NODES = (lightningRoadmap as RoadmapJson).nodes.map((node) => node.id);

const APPROVED_PROJECTS = [
  {
    slug: "hello-regtest",
    daysAgo: 280,
    prUrl: "https://github.com/bitcoin/bitcoin/pull/29812",
  },
  {
    slug: "address-lab",
    daysAgo: 240,
    prUrl: "https://github.com/rust-bitcoin/rust-bitcoin/pull/2104",
  },
  {
    slug: "tx-decoder",
    daysAgo: 210,
    prUrl: null,
  },
  {
    slug: "mini-wallet",
    daysAgo: 180,
    prUrl: "https://github.com/bitcoin-core/gui/pull/812",
  },
  {
    slug: "block-explorer",
    daysAgo: 150,
    prUrl: null,
  },
  {
    slug: "node-dashboard",
    daysAgo: 120,
    prUrl: "https://github.com/lightningnetwork/lnd/pull/9123",
  },
  {
    slug: "payment-processor",
    daysAgo: 95,
    prUrl: null,
  },
  {
    slug: "lightning-pos",
    daysAgo: 70,
    prUrl: "https://github.com/ElementsProject/lightning/pull/6781",
  },
  {
    slug: "custom-router",
    daysAgo: 45,
    prUrl: "https://github.com/lightningnetwork/lnd/pull/9344",
  },
  {
    slug: "core-pr-lab",
    daysAgo: 20,
    prUrl: "https://github.com/bitcoin/bitcoin/pull/31204",
  },
] as const;

const DEMO_REPOS = [
  {
    githubId: 910_001,
    name: "bitcoin",
    fullName: "bitcoin/bitcoin",
    description: "Bitcoin Core integration testing utilities and documentation patches.",
    language: "C++",
    stargazersCount: 84_200,
    forksCount: 36_400,
    isPinned: true,
    topics: ["bitcoin", "consensus", "p2p"],
  },
  {
    githubId: 910_002,
    name: "lnd",
    fullName: "lightningnetwork/lnd",
    description: "Lightning Network daemon contributions: routing, invoices, and RPC tooling.",
    language: "Go",
    stargazersCount: 7_800,
    forksCount: 2_100,
    isPinned: true,
    topics: ["lightning", "lnd", "routing"],
  },
  {
    githubId: 910_003,
    name: "rust-bitcoin",
    fullName: "rust-bitcoin/rust-bitcoin",
    description: "Rust primitives for transaction parsing, PSBT helpers, and address codecs.",
    language: "Rust",
    stargazersCount: 2_100,
    forksCount: 640,
    isPinned: false,
    topics: ["rust", "bitcoin", "library"],
  },
  {
    githubId: 910_004,
    name: "core-lightning",
    fullName: "ElementsProject/lightning",
    description: "CLN plugin work and BOLT conformance fixes from Pull project labs.",
    language: "C",
    stargazersCount: 1_400,
    forksCount: 390,
    isPinned: false,
    topics: ["lightning", "cln"],
  },
  {
    githubId: 910_005,
    name: "btcd",
    fullName: "btcsuite/btcd",
    description: "Fee estimation and block template experiments on regtest.",
    language: "Go",
    stargazersCount: 5_600,
    forksCount: 2_000,
    isPinned: false,
    topics: ["bitcoin", "go"],
  },
  {
    githubId: 910_006,
    name: "ldk-node",
    fullName: "lightningdevkit/ldk-node",
    description: "LDK sample integrations for wallet builders on the Lightning roadmap.",
    language: "Rust",
    stargazersCount: 320,
    forksCount: 88,
    isPinned: false,
    topics: ["ldk", "lightning"],
  },
] as const;

const MERGED_PR_TITLES = [
  "docs: clarify regtest wallet rescan behavior",
  "feat: add bech32m address validation helper",
  "fix: reject truncated raw transaction payloads",
  "docs: update PSBT workflow examples for v2",
  "feat: expose feerate histogram in dashboard API",
  "fix: handle zero-conf channel open edge case",
  "docs: BOLT11 invoice field reference table",
  "feat: add keysend metadata parser for POS demo",
  "fix: pathfinding timeout on low-liquidity routes",
  "docs: contributor guide for first-time reviewers",
  "feat: regtest faucet script for hello-regtest lab",
  "fix: taproot witness stack size guard",
  "docs: mempool policy notes for fee thermometer",
  "feat: custom router scoring hook for teaching labs",
  "fix: lnurl withdraw callback validation",
  "docs: open source discovery checklist for builders",
  "feat: block header merkle branch viewer",
  "fix: channel balance rounding in dashboard cards",
  "docs: add sequence diagrams for HTLC settlement",
  "feat: export PR portfolio highlights on profile",
  "fix: descriptor checksum validation in wallet lab",
  "docs: regtest mining cheat sheet",
  "feat: splice simulator fee preview",
  "fix: onion payload length checks",
  "docs: maintainer review rubric examples",
] as const;

const OPEN_PR_TITLES = [
  "feat: experimental anchor output fee bumper",
  "docs: translate wallet setup guide to Spanish",
  "fix: flaky regtest integration test on CI",
  "feat: offer metadata preview in POS checkout",
] as const;

const ISSUE_TITLES = [
  "Add regtest recipe for dual-node channel tests",
  "Document minimum feerate for package relay experiments",
  "Expose watchtower hint in node dashboard",
  "Clarify PSBT finalizer ordering in lab README",
  "Support regtest autopilot for classroom setups",
  "Add sample keysend payload for router scoring",
  "Improve error text when BOLT11 expires",
  "Track channel reserve in liquidity panel",
  "Publish good-first-issue labels for new contributors",
  "Add screenshot guidelines for project submissions",
] as const;

const COMMIT_MESSAGES = [
  "chore: sync regtest fixtures for address-lab",
  "test: cover witness v1 parsing in tx-decoder",
  "docs: link Pull roadmap from mini-wallet README",
  "refactor: extract feerate helpers for dashboard",
  "feat: add merged PR highlight selector",
  "fix: handle empty mempool on fee thermometer boot",
  "test: add keysend roundtrip for POS demo",
  "docs: note anchor channel requirements",
  "chore: bump dev dependencies for router lab",
  "feat: seed demo timeline events for profile preview",
] as const;

function daysAgoIso(days: number, hour = 12): string {
  const date = new Date();
  date.setUTCHours(hour, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString();
}

function chunk<T>(items: T[], size: number): T[][] {
  const batches: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    batches.push(items.slice(index, index + size));
  }
  return batches;
}

async function removeExistingDemoProfile() {
  const db = getDb();

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, DEMO_PROFILE_USERNAME));

  const ids = new Set([
    DEMO_PROFILE_USER_ID,
    ...existing.map((row) => row.id),
  ]);

  for (const id of ids) {
    await db.execute(sql`delete from auth.users where id = ${id}`);
  }
}

async function seedAuthUser(now: string) {
  const db = getDb();

  await db.execute(sql`
    insert into auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) values (
      '00000000-0000-0000-0000-000000000000',
      ${DEMO_PROFILE_USER_ID}::uuid,
      'authenticated',
      'authenticated',
      ${DEMO_AUTH_EMAIL},
      crypt('pull-demo-satoshi-not-for-login', gen_salt('bf')),
      ${now}::timestamptz,
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Satoshi","user_name":"satoshi"}'::jsonb,
      ${now}::timestamptz,
      ${now}::timestamptz
    )
    on conflict (id) do nothing
  `);
}

async function seedUser(now: string) {
  const db = getDb();
  await db.insert(users).values({
    id: DEMO_PROFILE_USER_ID,
    username: DEMO_PROFILE_USERNAME,
    displayName: "Satoshi",
    avatar:
      "https://ui-avatars.com/api/?name=Satoshi&background=c8f231&color=231e1e&size=256&bold=true",
    bio: "Protocol-curious builder shipping Bitcoin and Lightning software in public. Learning on Pull, contributing upstream, and documenting the path for the next cohort.",
    githubUsername: "satoshi",
    email: null,
    website: "https://pull.dev",
    twitterUrl: null,
    linkedinUrl: null,
    skills: [
      "Bitcoin",
      "Lightning",
      "Rust",
      "TypeScript",
      "Open Source",
      "Protocol Design",
      "Git",
    ],
    lookingFor: ["bitcoin_project", "lightning_project", "volunteer_contributions"],
    profilePublic: true,
    listedInDirectory: false,
    role: "builder",
    xp: 0,
    level: 1,
    createdAt: daysAgoIso(420, 9),
    updatedAt: now,
    lastActiveAt: now,
  });
}

async function seedRoadmapProgress() {
  const db = getDb();
  const rows: Array<typeof userRoadmapProgress.$inferInsert> = [];

  for (const [index, nodeSlug] of BITCOIN_NODES.entries()) {
    rows.push({
      userId: DEMO_PROFILE_USER_ID,
      roadmapSlug: "bitcoin",
      nodeSlug,
      status: "completed",
      completedAt: daysAgoIso(400 - index * 4, 10 + (index % 6)),
      createdAt: daysAgoIso(400 - index * 4, 10 + (index % 6)),
      updatedAt: daysAgoIso(400 - index * 4, 10 + (index % 6)),
    });
  }

  for (const [index, nodeSlug] of LIGHTNING_NODES.entries()) {
    rows.push({
      userId: DEMO_PROFILE_USER_ID,
      roadmapSlug: "lightning",
      nodeSlug,
      status: "completed",
      completedAt: daysAgoIso(180 - index * 3, 11 + (index % 5)),
      createdAt: daysAgoIso(180 - index * 3, 11 + (index % 5)),
      updatedAt: daysAgoIso(180 - index * 3, 11 + (index % 5)),
    });
  }

  for (const batch of chunk(rows, 40)) {
    await db.insert(userRoadmapProgress).values(batch);
  }
}

async function seedApprovedSubmissions() {
  const db = getDb();
  const rows: Array<typeof projectSubmissions.$inferInsert> = [];

  for (const project of APPROVED_PROJECTS) {
    const record = await ensureProjectRecord(project.slug);
    if (!record) {
      throw new Error(`Missing catalog project: ${project.slug}`);
    }

    const reviewedAt = daysAgoIso(project.daysAgo);
    const submittedAt = daysAgoIso(project.daysAgo + 5);

    rows.push({
      userId: DEMO_PROFILE_USER_ID,
      projectId: record.id,
      status: "approved",
      repoUrl: `https://github.com/satoshi/${project.slug}`,
      prUrl: project.prUrl,
      liveDemoUrl: `https://${project.slug}.demo.pull.dev`,
      notes: `Completed on Pull with reviewer sign-off. Demo profile seed for ${project.slug}.`,
      submittedAt,
      reviewedAt,
      reviewRound: 1,
      createdAt: submittedAt,
      updatedAt: reviewedAt,
    });
  }

  await db.insert(projectSubmissions).values(rows);
  const inserted = await db
    .select()
    .from(projectSubmissions)
    .where(eq(projectSubmissions.userId, DEMO_PROFILE_USER_ID));

  return inserted;
}

async function seedGithubRepositories(now: string) {
  const db = getDb();
  const rows = DEMO_REPOS.map((repo, index) => ({
    userId: DEMO_PROFILE_USER_ID,
    githubId: repo.githubId,
    name: repo.name,
    fullName: repo.fullName,
    description: repo.description,
    htmlUrl: `https://github.com/${repo.fullName}`,
    language: repo.language,
    stargazersCount: repo.stargazersCount,
    forksCount: repo.forksCount,
    openIssuesCount: 12 + index,
    licenseSpdx: "MIT",
    topics: [...repo.topics],
    isFork: false,
    isPrivate: false,
    isPinned: repo.isPinned,
    defaultBranch: "master",
    pushedAt: daysAgoIso(index * 3 + 1),
    githubCreatedAt: daysAgoIso(900 + index * 10),
    githubUpdatedAt: daysAgoIso(index + 1),
    syncedAt: now,
  }));

  await db.insert(githubRepositories).values(rows);
}

async function seedGithubPullRequests(now: string) {
  const db = getDb();
  const rows: Array<typeof githubPullRequests.$inferInsert> = [];
  let githubId = 920_000;

  for (const [index, title] of MERGED_PR_TITLES.entries()) {
    const repo = DEMO_REPOS[index % DEMO_REPOS.length];
    const number = 1000 + index;
    const createdAt = daysAgoIso(360 - index * 10);
    const mergedAt = daysAgoIso(358 - index * 10);
    const contributionType =
      title.startsWith("docs:") ? "documentation" : index % 5 === 0 ? "bugfix" : "feature";

    rows.push({
      userId: DEMO_PROFILE_USER_ID,
      githubId: githubId++,
      number,
      title,
      state: "closed",
      merged: true,
      repoFullName: repo.fullName,
      htmlUrl: `https://github.com/${repo.fullName}/pull/${number}`,
      githubCreatedAt: createdAt,
      githubClosedAt: mergedAt,
      githubMergedAt: mergedAt,
      labels: contributionType === "documentation" ? ["documentation"] : ["enhancement"],
      language: repo.language,
      filesChanged: 3 + (index % 9),
      additions: 40 + index * 6,
      deletions: 8 + (index % 12),
      reviewComments: 2 + (index % 7),
      contributionType,
      syncedAt: now,
    });
  }

  for (const [index, title] of OPEN_PR_TITLES.entries()) {
    const repo = DEMO_REPOS[index % DEMO_REPOS.length];
    const number = 2000 + index;
    const createdAt = daysAgoIso(14 - index);

    rows.push({
      userId: DEMO_PROFILE_USER_ID,
      githubId: githubId++,
      number,
      title,
      state: "open",
      merged: false,
      repoFullName: repo.fullName,
      htmlUrl: `https://github.com/${repo.fullName}/pull/${number}`,
      githubCreatedAt: createdAt,
      labels: ["enhancement"],
      language: repo.language,
      filesChanged: 2 + index,
      additions: 24 + index * 8,
      deletions: 3,
      reviewComments: 1 + index,
      contributionType: title.startsWith("docs:") ? "documentation" : "feature",
      syncedAt: now,
    });
  }

  for (const batch of chunk(rows, 25)) {
    await db.insert(githubPullRequests).values(batch);
  }
}

async function seedGithubIssues(now: string) {
  const db = getDb();
  const rows: Array<typeof githubIssues.$inferInsert> = [];
  let githubId = 930_000;

  for (const [index, title] of ISSUE_TITLES.entries()) {
    const repo = DEMO_REPOS[index % DEMO_REPOS.length];
    const number = 400 + index;
    const createdAt = daysAgoIso(300 - index * 12);

    rows.push({
      userId: DEMO_PROFILE_USER_ID,
      githubId: githubId++,
      number,
      title,
      state: index % 4 === 0 ? "closed" : "open",
      relation: index % 3 === 0 ? "assigned" : "authored",
      repoFullName: repo.fullName,
      htmlUrl: `https://github.com/${repo.fullName}/issues/${number}`,
      githubCreatedAt: createdAt,
      githubClosedAt: index % 4 === 0 ? daysAgoIso(290 - index * 12) : null,
      syncedAt: now,
    });
  }

  await db.insert(githubIssues).values(rows);
}

async function seedGithubCommits(now: string) {
  const db = getDb();
  const rows: Array<typeof githubCommits.$inferInsert> = [];

  for (let index = 0; index < 48; index += 1) {
    const repo = DEMO_REPOS[index % DEMO_REPOS.length];
    const message = COMMIT_MESSAGES[index % COMMIT_MESSAGES.length];
    const committedAt = daysAgoIso(320 - index * 4, 8 + (index % 10));

    rows.push({
      userId: DEMO_PROFILE_USER_ID,
      sha: `de00${index.toString(16).padStart(36, "0")}`,
      message,
      repoFullName: repo.fullName,
      htmlUrl: `https://github.com/${repo.fullName}/commit/demo${index}`,
      committedAt,
      syncedAt: now,
    });
  }

  for (const batch of chunk(rows, 30)) {
    await db.insert(githubCommits).values(batch);
  }
}

async function seedContributionDays(now: string) {
  const db = getDb();
  const rows: Array<typeof githubContributionDays.$inferInsert> = [];

  for (let days = 0; days < 365; days += 1) {
    const weekday = new Date(daysAgoIso(days)).getUTCDay();
    const base = weekday === 0 || weekday === 6 ? 1 : 3;
    const count = days < 45 ? base + (days % 5) + 2 : base + (days % 4);

    rows.push({
      userId: DEMO_PROFILE_USER_ID,
      contributionDate: daysAgoIso(days).slice(0, 10),
      count,
      color: count > 6 ? "#c8f231" : count > 3 ? "#9db824" : "#5f7320",
      syncedAt: now,
    });
  }

  for (const batch of chunk(rows, 60)) {
    await db.insert(githubContributionDays).values(batch);
  }
}

async function seedXpEvents(
  submissions: Array<typeof projectSubmissions.$inferSelect>,
) {
  const db = getDb();
  const rows: Array<typeof xpEvents.$inferInsert> = [];

  for (const nodeSlug of BITCOIN_NODES) {
    rows.push({
      userId: DEMO_PROFILE_USER_ID,
      sourceType: "lesson_complete",
      sourceKey: lessonXpKey("bitcoin", nodeSlug),
      amount: XP_REWARDS.lesson_complete,
      metadata: { roadmapSlug: "bitcoin", nodeSlug },
      createdAt: daysAgoIso(400),
    });
  }

  for (const nodeSlug of LIGHTNING_NODES) {
    rows.push({
      userId: DEMO_PROFILE_USER_ID,
      sourceType: "lesson_complete",
      sourceKey: lessonXpKey("lightning", nodeSlug),
      amount: XP_REWARDS.lesson_complete,
      metadata: { roadmapSlug: "lightning", nodeSlug },
      createdAt: daysAgoIso(180),
    });
  }

  rows.push(
    {
      userId: DEMO_PROFILE_USER_ID,
      sourceType: "roadmap_complete",
      sourceKey: roadmapXpKey("bitcoin"),
      amount: XP_REWARDS.roadmap_complete,
      metadata: { roadmapSlug: "bitcoin" },
      createdAt: daysAgoIso(120),
    },
    {
      userId: DEMO_PROFILE_USER_ID,
      sourceType: "roadmap_complete",
      sourceKey: roadmapXpKey("lightning"),
      amount: XP_REWARDS.roadmap_complete,
      metadata: { roadmapSlug: "lightning" },
      createdAt: daysAgoIso(30),
    },
  );

  for (const submission of submissions) {
    rows.push({
      userId: DEMO_PROFILE_USER_ID,
      sourceType: "project_submitted",
      sourceKey: submission.id,
      amount: XP_REWARDS.project_submitted,
      metadata: { submissionId: submission.id },
      createdAt: submission.submittedAt ?? daysAgoIso(60),
    });
    rows.push({
      userId: DEMO_PROFILE_USER_ID,
      sourceType: "project_approved",
      sourceKey: submission.id,
      amount: XP_REWARDS.project_approved,
      metadata: { submissionId: submission.id },
      createdAt: submission.reviewedAt ?? daysAgoIso(55),
    });
    if (submission.prUrl) {
      rows.push({
        userId: DEMO_PROFILE_USER_ID,
        sourceType: "merged_pr",
        sourceKey: submission.id,
        amount: XP_REWARDS.merged_pr,
        metadata: { submissionId: submission.id, prUrl: submission.prUrl },
        createdAt: submission.reviewedAt ?? daysAgoIso(55),
      });
    }
  }

  for (const batch of chunk(rows, 50)) {
    await db.insert(xpEvents).values(batch).onConflictDoNothing();
  }
}

async function main() {
  const now = new Date().toISOString();

  console.log("Seeding demo profile: Satoshi (@satoshi)…");
  await removeExistingDemoProfile();
  await seedAuthUser(now);
  await seedUser(now);
  await seedRoadmapProgress();
  const submissions = await seedApprovedSubmissions();
  await seedGithubRepositories(now);
  await seedGithubPullRequests(now);
  await seedGithubIssues(now);
  await seedGithubCommits(now);
  await seedContributionDays(now);
  await seedXpEvents(submissions);

  const unlocked = await syncAchievementsForUser(DEMO_PROFILE_USER_ID);
  const totals = await getUserXpTotals(DEMO_PROFILE_USER_ID);

  console.log("");
  console.log("Demo profile ready:");
  console.log(`  URL:      /u/${DEMO_PROFILE_USERNAME}`);
  console.log(`  Lessons:  ${BITCOIN_NODES.length + LIGHTNING_NODES.length} completed`);
  console.log(`  Projects: ${APPROVED_PROJECTS.length} approved`);
  console.log(`  PRs:      ${MERGED_PR_TITLES.length} merged, ${OPEN_PR_TITLES.length} open`);
  console.log(`  XP:       ${totals.xp} (level ${totals.level})`);
  console.log(`  Badges:   ${unlocked.length} achievements synced`);
}

main()
  .catch(async (error) => {
    console.error("seed-demo-profile failed:", error);
    await resetDbClient();
    process.exit(1);
  })
  .finally(async () => {
    await resetDbClient();
    process.exit(0);
  });
