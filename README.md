<p align="center">
  <img src="./public/pull-logo.png" alt="Pull" width="172" height="172" />
</p>


<p align="center">
  <strong>The operating system for open source builders.</strong><br />
  Learn on roadmaps. Ship real projects. Contribute to Bitcoin &amp; Lightning OSS. Prove it in public.
</p>

<p align="center">
  <a href="https://pullos.dev">Live site</a> ·
  <a href="./ROADMAP.md">Roadmap</a> ·
  <a href="./CONTRIBUTING.md">Contributing</a> ·
  <a href="./LICENSE">License (MIT)</a>
</p>

---

## Vision

Most developer education stops at tutorials. Most open source onboarding stops at “good first issue” lists with no context. **Pull closes that gap.**

Pull is a full-stack learning platform where developers:

1. **Learn** — follow structured Bitcoin and Lightning roadmaps with MDX lessons, milestones, prerequisites, and interactive study plans  
2. **Ship** — complete build projects tied to lessons and submit proof of work  
3. **Contribute** — discover repositories and issues matched to their level, with GitHub activity synced into the product  
4. **Prove** — publish a builder portfolio with PRs, reputation, achievements, and a timeline of real work  

The curriculum lives in **Git as MDX**. The app handles progress, auth, reviews, and integrations. Self-host it, fork it, or contribute content back upstream.

> **Become an open source builder** — not by watching videos, but by reading primary sources, running tools locally, shipping projects, and merging code.

---

## Try it live

| | |
| --- | --- |
| **Site** | [https://pullos.dev](https://pullos.dev) |
| **Public roadmaps** | [/roadmaps/bitcoin](https://pullos.dev/roadmaps/bitcoin) · [/roadmaps/lightning](https://pullos.dev/roadmaps/lightning) |
| **Sample lesson** | [Developer Environment](https://pullos.dev/roadmaps/bitcoin/lessons/foundations-intro) (no sign-in required) |

### Screenshots

Screenshots belong in [`docs/screenshots/`](./docs/screenshots/). Suggested captures: home, roadmap map, lesson reader, dashboard. Until those are added, explore the [live site](https://pullos.dev).

<p align="center">
  <img src="./public/pull-logo-dark.png" alt="Pull logo" width="320" />
</p>

---

## Features

### Learning (public + signed-in)

| Feature | Description |
| --- | --- |
| **Roadmap maps** | Visual section spine with topic chips, prerequisite banners, and progress bars |
| **62 MDX lessons** | 33 Bitcoin + 29 Lightning lessons with objectives, resources, and reflection prompts |
| **Public reading** | Roadmaps and lessons are crawlable; sign-in unlocks progress and locks |
| **Lesson reader** | Sticky TOC, reading progress, keyboard shortcuts (`J`/`K`/`R`/`?`) |
| **Study plans** | Required reading, [Decoding Bitcoin](https://bitcoindevs.xyz/decoding) interactive labs, Bitcoin Search deep links |
| **Build challenges** | Project lessons with lab evidence checklists |

### Builder workspace (signed-in)

| Feature | Description |
| --- | --- |
| **Dashboard** | Continue learning, weekly goals, GitHub sync status, capped section lists |
| **Progress sync** | Lesson completion stored in Postgres with local merge for offline-first UX |
| **Projects & review** | Submit work, peer review workflow, staff reviewer roles |
| **GitHub integration** | OAuth token storage, PR/issue sync, daily cron job |
| **Portfolio & reputation** | Public profiles, PR portfolio, builder XP and achievements |
| **Notifications** | Optional email via Resend |

### For maintainers & contributors

| Feature | Description |
| --- | --- |
| **Content validation** | `validate:roadmaps` and `validate:content` scripts |
| **Drizzle migrations** | Versioned schema through `0013_user_weekly_goals` |
| **SEO** | Sitemap, Open Graph, canonical URLs on lessons |

---

## Tech stack

| Layer | Technology |
| --- | --- |
| Framework | [Next.js 16](https://nextjs.org/) (App Router, React 19) |
| Language | TypeScript |
| Styling | Tailwind CSS 4, [shadcn/ui](https://ui.shadcn.com/) |
| Content | MDX (`next-mdx-remote`), gray-matter, Mermaid diagrams |
| Auth | [Supabase Auth](https://supabase.com/docs/guides/auth) (GitHub OAuth) |
| Database | PostgreSQL via Supabase, [Drizzle ORM](https://orm.drizzle.team/) |
| Email | [Resend](https://resend.com/) (optional) |
| Deploy | [Vercel](https://vercel.com/) (recommended) |

---

## Quick start

```bash
git clone https://github.com/Megasley/pull.git
cd pull
npm install
cp .env.example .env.local
# Edit .env.local — see Environment variables below
npm run db:migrate
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Browse lessons without auth. Sign in at `/sign-in` to track progress on the dashboard.

---

## Installation (full setup)

### Prerequisites

- Node.js **20+**
- npm **10+**
- A [Supabase](https://supabase.com/) project (Postgres + Auth)
- A [GitHub OAuth App](https://github.com/settings/developers) for local sign-in testing

### 1. Clone and install dependencies

```bash
git clone https://github.com/Megasley/pull.git
cd pull
npm install
```

### 2. Environment variables

Copy the example file **once**—never commit the result:

```bash
cp .env.example .env.local
```

| Variable | Required | Description |
| --- |:---:| --- |
| `NEXT_PUBLIC_SUPABASE_URL` | ✓ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✓ | Supabase anonymous key |
| `DATABASE_URL` | ✓ | Postgres URI (Supabase → Settings → Database) |
| `NEXT_PUBLIC_SITE_URL` | ✓ | Canonical URL (`http://localhost:3000` locally) |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | | Google Analytics 4 ID (`G-XXXXXXXX`) |
| `CRON_SECRET` | prod | Bearer token for `/api/cron/github-sync` |
| `RESEND_API_KEY` | | Email sending (app no-ops without it) |
| `RESEND_FROM` | | Verified sender address |
| `PULL_REVIEWER_GITHUB_USERNAMES` | | Staff reviewer GitHub usernames |
| `PULL_ADMIN_GITHUB_USERNAMES` | | Platform admin GitHub usernames |
| `PULL_PEER_REVIEW_*` | | Peer review tuning (see `.env.example`) |

### 3. Database

Apply Drizzle migrations:

```bash
npm run db:migrate
npm run db:validate
```

Schema lives in `lib/db/schema/`. Migrations are in `drizzle/migrations/` (tags `0000`–`0013`).

<details>
<summary>Legacy Supabase SQL migrations</summary>

Older deployments may have applied files in `supabase/migrations/` manually. Fresh installs should use Drizzle only. If you are migrating an existing database, compare both directories before applying.

</details>

### 4. GitHub OAuth

1. **Supabase** → Authentication → Providers → enable **GitHub**  
2. **GitHub** → Settings → Developer settings → OAuth Apps → New OAuth App  
3. **Authorization callback URL:** `https://<your-project-ref>.supabase.co/auth/v1/callback`  
4. Copy **Client ID** and **Client secret** into Supabase  
5. Restart the dev server and visit `/sign-in`

### 5. Optional: email & cron

**Resend** — add `RESEND_API_KEY` and a verified `RESEND_FROM` domain for notification emails.

**GitHub sync cron** — set `CRON_SECRET` and deploy with Vercel Cron (see `vercel.json`). The route `GET /api/cron/github-sync` expects `Authorization: Bearer <CRON_SECRET>`.

### 6. Run

```bash
npm run dev          # development (Turbopack)
npm run build        # production build
npm run start        # serve production build
```

---

## Route map

| Path | Access | Purpose |
| --- | --- | --- |
| `/` | Public | Landing |
| `/roadmaps`, `/roadmaps/[slug]` | Public | Roadmap index and map |
| `/roadmaps/[slug]/lessons/[lesson]` | Public read | MDX lesson (progress requires sign-in) |
| `/projects` | Public | Project catalog |
| `/sign-in` | Public | GitHub OAuth |
| `/dashboard`, `/settings/*` | Auth | Builder workspace |
| `/discover`, `/issues` | Auth | OSS discovery |
| `/portfolio`, `/reputation`, `/activity` | Auth | Proof surfaces |
| `/admin` | Admin | Platform admin (env allowlist) |

Middleware skips Supabase session checks on public read routes for faster lesson navigation. Protected routes redirect to `/sign-in?next=…`.

---

## Content authoring

Lessons and roadmaps are **first-class repo content**:

```
content/
  bitcoin/           # MDX files (slug = filename)
  lightning/
  roadmaps/
    bitcoin.json     # Nodes, sections, prerequisites
    lightning.json
public/
  lessons/           # Static diagrams referenced from MDX
```

Each roadmap node `id` must match `content/<roadmap>/<id>.mdx`.

Validate before committing:

```bash
npm run validate:roadmaps
npm run validate:content
```

See [CONTRIBUTING.md](./CONTRIBUTING.md#contributing-content-mdx-lessons) for frontmatter reference and MDX components.

---

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run lint` | ESLint |
| `npm run format` | Prettier write |
| `npm run format:check` | Prettier check |
| `npm run validate:roadmaps` | Validate roadmap JSON |
| `npm run validate:content` | Validate MDX vs roadmap nodes |
| `npm run db:generate` | Generate Drizzle migration from schema |
| `npm run db:migrate` | Apply migrations |
| `npm run db:validate` | Verify tables, FKs, indexes |
| `npm run db:studio` | Drizzle Studio GUI |

---

## Project structure

```
app/                 Next.js routes, server actions, API handlers
components/          UI — dashboard, lessons, layout, MDX
content/             MDX lessons + roadmap JSON (source of truth)
drizzle/             SQL migrations
hooks/               Client hooks (auth, progress, shortcuts)
lib/                 Auth, DB schema, GitHub, content loaders
public/              Static assets, lesson diagrams, brand marks
scripts/             Validation and maintenance scripts
styles/              Global CSS, lesson/roadmap/MDX styles
types/               Shared TypeScript types
docs/                Contributor docs and screenshots
```

---

## Deployment

Recommended: **Vercel + Supabase**.

1. Push to GitHub  
2. Import repo in Vercel  
3. Set all required environment variables for **Production**  
4. Set `NEXT_PUBLIC_SITE_URL` to your production domain  
5. Run `npm run db:migrate` against production `DATABASE_URL`  
6. Configure Supabase Auth redirect URLs for your domain  
7. Set `CRON_SECRET` and enable Vercel Cron (`vercel.json`)  

Post-deploy smoke test:

- [ ] Logged-out lesson URL loads and shares OG metadata  
- [ ] GitHub sign-in → dashboard → complete a lesson → refresh persists progress  
- [ ] `/settings/github` connect + sync (if promoting GitHub features)  

---

## Roadmap

Product direction lives in **[ROADMAP.md](./ROADMAP.md)** — shipped features, near-term goals, and explicit non-goals.

Highlights:

- **Now:** Bitcoin + Lightning roadmaps, public lessons, dashboard, GitHub sync  
- **Next:** discover/issues matching, screenshot gallery, self-host docs, good-first-issues  
- **Later:** additional roadmaps, cohort mode, localized content, read-only APIs  

---

## Contributing

We welcome bug fixes, lesson improvements, UI polish, and platform features.

1. Read [CONTRIBUTING.md](./CONTRIBUTING.md)  
2. Follow [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)  
3. Open an issue or PR  

Content contributors: start with typos, resource links, or `searchQueries` on a lesson you just completed.

---

## Security & open-sourcing checklist

Before making **your fork** public—or before the upstream repo goes public—verify:

- [ ] **No secrets** in Git history (API keys, `DATABASE_URL`, `CRON_SECRET`, OAuth secrets)  
- [ ] **`.env` and `.env.local` are gitignored** — only `.env.example` with placeholders is committed  
- [ ] **Rotate** any credential that was ever committed, even briefly  
- [ ] **Remove** internal-only notes, private URLs, test accounts, and personal data from commits  
- [ ] **Review** `PULL_*` admin/reviewer username env vars — do not ship production allowlists in the repo  
- [ ] **LICENSE**, **README**, **CONTRIBUTING**, and **CODE_OF_CONDUCT** are present (this repo includes them)  

Report vulnerabilities privately to **hello@pullos.dev** — do not file public issues for security bugs.

---

## License

Pull is open source under the **[MIT License](./LICENSE)**.

Copyright (c) 2026 Pull contributors.

---

## Acknowledgments

- [Bitcoin Dev Project](https://bitcoindevs.xyz/) — Decoding Bitcoin and curriculum inspiration  
- [Bitcoin Search](https://bitcoinsearch.xyz/) — research deep links from lessons  
- The Bitcoin and Lightning open source communities  

---

<p align="center">
  <sub>Built for builders who merge code, not just collect certificates.</sub>
</p>
