# Contributing to Pull

Thank you for helping build the operating system for open source builders. This guide covers setup, contribution types, and review expectations.

## Table of contents

- [Code of conduct](#code-of-conduct)
- [Ways to contribute](#ways-to-contribute)
- [Development setup](#development-setup)
- [Project conventions](#project-conventions)
- [Contributing content (MDX lessons)](#contributing-content-mdx-lessons)
- [Lesson guide style](#lesson-guide-style)
- [Contributing code](#contributing-code)
- [Validation and checks](#validation-and-checks)
- [Pull request process](#pull-request-process)
- [Reporting bugs and security issues](#reporting-bugs-and-security-issues)

---

## Code of conduct

This project follows the [Contributor Covenant](./CODE_OF_CONDUCT.md). By participating, you agree to uphold it. Report issues to **hello@pullos.dev**.

---

## Ways to contribute

You do not need to write application code to help.

| Area | Examples |
| --- | --- |
| **Lessons** | Fix typos, add diagrams, improve explanations, add `searchQueries` or interactive lab links |
| **Roadmaps** | Adjust node order, prerequisites, or section descriptions in `content/roadmaps/*.json` |
| **Docs** | README, ROADMAP, self-hosting guides, screenshots |
| **UI/UX** | Dashboard, lesson reader, accessibility, mobile layout |
| **Platform** | Auth, progress sync, GitHub integration, notifications |
| **Issues** | Repro steps, feature proposals, roadmap discussions |

Check [ROADMAP.md](./ROADMAP.md) for planned work and open a discussion before large features.

---

## Development setup

### Prerequisites

- **Node.js** 20+ (LTS recommended)
- **npm** 10+
- **PostgreSQL** via [Supabase](https://supabase.com/) (free tier works for local dev)
- **GitHub OAuth app** (for sign-in testing)

### 1. Clone and install

```bash
git clone https://github.com/Megasley/pull.git
cd pull
npm install
cp .env.example .env.local
```

### 2. Configure environment

Edit `.env.local`. Required for a full local experience:

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `DATABASE_URL` | Postgres connection string (pooler URI) |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` locally |

Optional:

| Variable | Purpose |
| --- | --- |
| `CRON_SECRET` | Protects `/api/cron/github-sync` |
| `RESEND_API_KEY` / `RESEND_FROM` | Transactional email (no-ops without key) |
| `PULL_REVIEWER_GITHUB_USERNAMES` | Comma-separated staff reviewers |
| `PULL_ADMIN_GITHUB_USERNAMES` | Comma-separated platform admins |

**Never commit `.env`, `.env.local`, or real secrets.** See [Security](#reporting-bugs-and-security-issues).

### 3. Database migrations

Apply Drizzle migrations:

```bash
npm run db:migrate
npm run db:validate
```

Legacy Supabase SQL files in `supabase/migrations/` may exist for older deployments; new installs should rely on Drizzle through the latest journal entry (currently `0016_admin_metrics_snapshots`).

### 4. GitHub OAuth

1. Supabase → **Authentication** → **Providers** → enable **GitHub**
2. Create a [GitHub OAuth App](https://github.com/settings/developers)
3. Set callback URL: `https://<project-ref>.supabase.co/auth/v1/callback`
4. Paste client ID/secret into Supabase

### 5. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

- **Public:** `/`, `/roadmaps`, `/roadmaps/bitcoin/lessons/foundations-intro`
- **Auth required:** `/dashboard`, `/settings/*`, `/discover`, `/issues`

---

## Project conventions

### Stack

- **Next.js 16** App Router, React 19, TypeScript
- **Tailwind CSS 4** + shadcn/ui
- **MDX** lessons via `next-mdx-remote`
- **Drizzle ORM** + PostgreSQL
- **Supabase Auth** (GitHub OAuth)

Read `node_modules/next/dist/docs/` before assuming Next.js APIs from older versions—this repo tracks recent Next.js releases with breaking changes.

### Code style

- Match existing patterns in the file you edit
- Run `npm run lint` and `npm run format:check` before opening a PR
- Prefer focused diffs—one logical change per PR when possible
- Use `@/` path aliases for imports

### File layout

```
app/           Routes and API handlers
components/    UI (dashboard, lessons, layout, mdx)
content/       MDX lessons + roadmap JSON
lib/           Auth, DB, GitHub, content loaders
hooks/         Client hooks (progress, auth, shortcuts)
drizzle/       SQL migrations
scripts/       Content and schema validation
types/         Shared TypeScript types
```

---

## Contributing content (MDX lessons)

Lessons live at `content/<roadmap>/<node-slug>.mdx`. Each node in `content/roadmaps/<roadmap>.json` must have a matching MDX file.

### Frontmatter example

```yaml
---
title: Lesson title
description: One-line summary for SEO and cards
difficulty: beginner | intermediate | advanced
duration: 3 days
objectives:
  - Outcome the reader should achieve
resources:
  - title: Resource name
    url: https://example.com
    kind: article
    required: true
reflectionPrompts:
  - Question for the study plan
searchQueries:
  - BIP152
lab:
  title: Lab title
  description: What to build or document
  evidence:
    - Artifact the learner should submit
---
```

### Lesson guide style

Lessons should read like an **easy-to-follow guide**: numbered steps, clear goals, and checkable progress. Match the skeleton to the lesson type — do not force the same headings on every file.

**Step count is flexible.** Use as many or as few steps as the content needs (often 3–7). There is no requirement to hit exactly five.

| Type | Typical flow (expand or shrink) |
| --- | --- |
| **Setup / how-to** | Study-plan Step 1 (required reading) → Terms → Setup & verify → Lab → Next lesson |
| **Concept** | Study-plan Step 1 → Core idea → Try it → Lab / mistakes → Next lesson |
| **Project** | Study-plan Step 1 → Goal → Milestones → Build / evidence → Next lesson |
| **OSS / soft skill** | Study-plan Step 1 → Context → Practice → Checklist → Next lesson |

**Rules**

1. Use `## Step N — …` headings in MDX for the article body. Number consecutively; use as many or as few steps as the content needs (no fixed count).
2. Prefer a short **Done when:** line after major steps.
3. Map `lab.evidence` to a hands-on step — do not leave a generic “regtest check” when the lesson is about Git or economics.
4. **Required reading is rendered once** by the study plan as **Step 1 // Required reading** from frontmatter `required: true`. **Do not** add `## Step 1 — Required reading` (or a duplicate link list) in MDX.
5. Start MDX steps at **Step 1** only when there is **no** required reading; otherwise start at **Step 2** (terms / core idea / setup) so numbering stays continuous with the study plan.
6. **Optional further reading** is rendered once by the auto panel under the article (non-required resources). **Do not** add `## Step N — Optional further reading` (or any duplicate link list) in MDX — it duplicates the panel.
7. End with a **Next lesson** pointer that matches `content/roadmaps/*.json` order.
8. Keep analogies and Mermaid diagrams — they support the guide; they do not replace steps.

Pilots: Full **Bitcoin** and **Lightning** tracks use the lesson guide pattern (study-plan Step 1 for required reading; MDX starts at Step 2; no duplicate further-reading or required-reading lists in MDX).

### MDX components

Available in lessons (see `components/mdx/`):

- `<Mermaid chart="..." caption="..." />` — diagrams (rendered at runtime via Mermaid; do not add hand-authored SVG flowcharts under `public/lessons/`)
- `<LessonImage />` — photos or screenshots only (not flowcharts)
- Standard GFM: tables, fenced code, callouts

### Interactive labs

Link out to trusted external interactives (e.g. [Decoding Bitcoin](https://bitcoindevs.xyz/decoding)) using `kind: interactive` resources—do not fork third-party curricula into this repo.

### Validation

```bash
npm run validate:roadmaps
npm run validate:content
npm run verify:quizzes
npm run verify:review-club
```

Fix all errors before submitting. Warnings (e.g. missing diagrams on concept lessons) should be addressed or explained in the PR.

### Chapter quizzes

Section checkpoint lessons are marked with `"chapterCheckpoint": true` on the last node in each roadmap section (`content/roadmaps/bitcoin.json`, `content/roadmaps/lightning.json`). Quiz content lives in `content/quizzes/`:

- One quiz per section (`sectionId` matches roadmap section `id`)
- Bitcoin quizzes: 5 questions each (`content/quizzes/bitcoin.json`)
- Lightning quizzes: 3–4 questions each (`content/quizzes/lightning.json`)
- 3–4 multiple-choice questions with `correctOptionId` matching an option `id`
- `passingScore` is the minimum correct answers to unlock mark-complete (soft gate: learners can skip with a warning)

Run `npm run verify:quizzes` after editing quizzes or checkpoint nodes.

### Review Club catalog

Curated external PRs, GFIs, and spec reviews live in `content/discovery/review-club.json` for both **bitcoin** and **lightning** tracks. Each item must include:

- `repoId` referencing `content/discovery/repositories.json`
- `lessonSlugs` and/or `sectionIds` for lesson embeds
- `reviewFocus` tags and a short `summary`

Run `npm run verify:review-club` after adding or editing items.

### Content guidelines

- Prefer primary sources: BIPs, Core docs, Bolt specs, reputable books
- Quote YAML values that contain `:`, backticks, or `<` characters
- Keep lesson slugs aligned with roadmap node `id` fields
- Write for developers new to Bitcoin/Lightning, not for hype
- Do **not** paste shared study habits (mental model / hands-on / glossary / resource order) into MDX — those live in `LessonStudyHabits` and render for every lesson automatically

### Content licensing rules

Application code is MIT. Everything under `content/` — plus original lesson
diagrams in `public/lessons/` — is **CC BY-SA 4.0** (see [`content/LICENSE`](./content/LICENSE)).
By opening a content PR you agree to license your contribution under CC BY-SA 4.0.

Third-party works are **linked, never copied**:

- **Link out, don't paste.** Required reading is a deep link to the source. Do
  not paste book chapters, spec text, or documentation into a lesson.
- **Write it yourself.** Explain concepts in your own words. A short direct
  quote is fine when it is attributed inline; a paragraph rewritten sentence by
  sentence from a source is not.
- **Don't fork third-party curricula** into this repo — that includes Decoding
  Bitcoin labs, which we deep-link instead.
- **Diagrams must be original** or carry a license that permits reuse, credited
  in the lesson.
- **New source, new entry.** If you introduce a resource that is not already
  cited, add it to [`lib/attributions.ts`](./lib/attributions.ts) and mirror it
  in [`docs/ATTRIBUTIONS.md`](./docs/ATTRIBUTIONS.md). Record the license as the
  upstream project publishes it, not from memory.

---

## Contributing code

### Branches

- `main` — stable; protect with review
- `feature/your-topic` or `fix/issue-description` — your work

### Common tasks

| Task | Where to look |
| --- | --- |
| Auth / protected routes | `lib/auth/routes.ts`, `lib/supabase/middleware.ts` |
| Lesson rendering | `components/content/`, `lib/content/compile-mdx.ts` |
| Roadmap UI | `components/roadmap/` |
| Progress sync | `app/actions/progress.ts`, `hooks/use-roadmap-progress.ts` |
| GitHub sync | `lib/github/` |
| Dashboard sections | `components/dashboard/` |

### Database changes

1. Edit schema in `lib/db/schema/`
2. `npm run db:generate`
3. Review generated SQL in `drizzle/migrations/`
4. `npm run db:migrate` locally
5. `npm run db:validate`
6. Include migration files in your PR

---

## Validation and checks

Before opening a PR:

```bash
npm run validate:roadmaps
npm run validate:content
npm run lint
npm run format:check
npm run build
```

CI (when configured) should run the same checks. A failing build blocks merge.

---

## Pull request process

1. **Fork** the repository (or branch in-repo if you are a maintainer)
2. **Create a branch** from `main`
3. **Make changes** with tests/validation as appropriate
4. **Write a clear PR description:**
   - What changed and why
   - Screenshots for UI changes (place in `docs/screenshots/` if helpful)
   - Link related issues
5. **Request review** — maintainers will respond when they can
6. **Address feedback** — we squash-merge small PRs when possible

### PR checklist

- [ ] No secrets, `.env` files, or personal data in the diff
- [ ] Content validation passes (if MDX/roadmap touched)
- [ ] `npm run build` succeeds
- [ ] README/docs updated if behavior or setup changed

---

## Reporting bugs and security issues

### Bugs

Open a [GitHub Issue](https://github.com/Megasley/pull/issues) with:

- Steps to reproduce
- Expected vs actual behavior
- Browser/OS and commit SHA if possible
- Screenshots or logs (redact tokens)

### Security

**Do not open public issues for vulnerabilities.**

Email **hello@pullos.dev** with:

- Description and impact
- Reproduction steps
- Suggested fix (optional)

We will acknowledge within a few business days.

### Before making your fork public

- Remove API keys, tokens, and production URLs from env files
- Keep `.env*` out of Git (use `.env.example` placeholders only)
- Scrub internal comments, test accounts, and private issue links from commits
- Rotate any credential that was ever committed

---

## Questions?

- **Roadmap / product:** [ROADMAP.md](./ROADMAP.md) or GitHub Discussions
- **Setup help:** GitHub Issues with the `question` label
- **Conduct:** hello@pullos.dev

We are glad you are here. Happy building.
