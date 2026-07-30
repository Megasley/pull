# Pull product roadmap

This document describes where Pull is today and where we are headed. It is a **product roadmap** for contributors and self-hosters—not a guarantee of delivery dates.

For how to help build any of these items, see [CONTRIBUTING.md](./CONTRIBUTING.md).

---

## Vision

Pull is the operating system for open source builders: **learn → ship → contribute → prove**. We want a single place where developers can follow credible curriculum, build real projects, contribute to Bitcoin and Lightning ecosystems, and show verifiable public proof of work.

---

## Shipped (v0.1 — current)

### Learning

- [x] **Bitcoin roadmap** — 33 MDX lessons from developer foundations through OSS contribution
- [x] **Lightning roadmap** — 29 MDX lessons from overview through routing, LND/CLN/LDK, and contrib paths
- [x] **Public lesson reading** — roadmaps and lessons are crawlable and shareable without sign-in
- [x] **Signed-in progress** — lesson completion, prerequisite locks, and roadmap progress synced to Postgres
- [x] **Rich lesson UX** — TOC, reading progress, objectives, study plans, keyboard shortcuts, prev/next navigation
- [x] **Interactive labs** — curated [Decoding Bitcoin](https://bitcoindevs.xyz/decoding) companion links in study plans
- [x] **Bitcoin Search research** — deep-link research queries from lessons (no embed)

### Builder workspace

- [x] **Dashboard** — continue learning, roadmap progress, projects, GitHub activity, weekly goals
- [x] **Onboarding wizard** — preferred roadmap + completion marker for new builders
- [x] **Projects & submissions** — build challenges tied to lessons, submission workflow
- [x] **GitHub integration** — OAuth token sync, PR/issue activity, scheduled cron sync
- [x] **Portfolio & reputation** — public builder profiles, PR portfolio, peer review workflow
- [x] **Achievements & XP** — builder level progression
- [x] **Email notifications** — opt-in Resend integration (defaults off)
- [x] **Discover / issues** — contribution discovery with difficulty and skill filters

### Platform

- [x] **Supabase Auth** — GitHub OAuth
- [x] **Drizzle ORM** — migrations through `0016_admin_metrics_snapshots`
- [x] **Admin ops** — funnel metrics (15m snapshot), live review queue, user detail, suspend/ban/restore, audit log
- [x] **Content validation** — roadmap JSON + MDX lint scripts
- [x] **SEO** — sitemap, Open Graph images on roadmaps and lessons
- [x] **Public beta framing** — Beta badge in nav + Feedback → GitHub Issues
- [x] **Social links** — GitHub + X in site config / footer

---

## In progress / polish

- [ ] **Screenshot gallery** in README (`docs/screenshots/`)
- [ ] **Self-host documentation** — production checklist for Vercel + Supabase deployers
- [ ] **Good first issue** labels + content contribution triage
- [ ] **P0 curriculum accuracy pass** — see [docs/pre-launch-checklist.md](./docs/pre-launch-checklist.md)

---

## Near term (next releases)

### Content

- [ ] Additional roadmap sections and lesson refresh passes (SegWit/Taproot depth, more Lightning BOLT coverage)
- [ ] More **interactive lab** mappings as Decoding Bitcoin and community tools evolve
- [ ] Lesson **searchQueries** backfill quality pass across all nodes

### Product

- [ ] Deeper **discover / issues** matching (repo tags, richer skill signals)
- [ ] **Offline-friendly** reading mode or export for lessons
- [ ] **Roadmap analytics** for maintainers (completion funnels, drop-off nodes)

### Open source

- [ ] **Good first issue** triage for docs and small UI fixes
- [ ] **Plugin-style content packs** — document how third parties add a new `content/<roadmap>/` tree

---

## Medium term

- [ ] **Additional roadmaps** — e.g. Core development, wallet engineering, Lightning app development as separate paths
- [ ] **Organization / cohort mode** — mentors, batch progress, shared goals
- [ ] **Localized content** — community translations of MDX lessons
- [ ] **API** — read-only progress and public portfolio endpoints for integrators
- [ ] **Mobile-optimized** lesson reading and dashboard

---

## Long term

- [ ] **Decentralized credentials** — optional export of verifiable completion artifacts
- [ ] **Federated instances** — run Pull for a community while sharing content packs
- [ ] **Live cohort features** — office hours, review queues, maintainer office

---

## Explicit non-goals (for now)

- Replacing Bitcoin Core, LND, or other upstream documentation
- Custodial wallets or holding user funds
- Embedding third-party search UIs that block iframe/API access (we deep-link instead)
- Forking external interactive curricula—we link to canonical sources

---

## How priorities are chosen

1. **Learner outcomes** — does it help someone go from curious to merged PR?
2. **Content quality** — accurate, well-sourced Bitcoin/Lightning material
3. **Maintainability** — MDX in Git, validated roadmaps, typed schema
4. **Community leverage** — features that scale with contributors, not just core team

Questions or proposals? Open a [GitHub Discussion](https://github.com/Megasley/pull/discussions) or issue with the `roadmap` label.
