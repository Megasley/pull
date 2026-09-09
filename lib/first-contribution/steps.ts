import { PRACTICE_ISSUE_LABEL, PRACTICE_REPO_NAME, practiceRepoLinks } from "./practice-repo";
import type { FirstContributionAccent } from "./step-accent";
import type { FirstContributionStepIconName } from "./step-icon";

/** Reuses the generic userRoadmapProgress table (see
 *  lib/first-contribution/progress.ts) rather than a dedicated table.
 *  Defined here, not in progress.ts, so DB-free consumers (e.g.
 *  lib/achievements/definitions.ts, imported by client components) don't
 *  transitively pull in the database client. */
export const FIRST_CONTRIBUTION_ROADMAP_SLUG = "first-contribution";

/** External tool downloads referenced by "Set Up Your Tools", centralized
 *  for the same reason practiceRepoLinks exists (see
 *  tests/first-contribution-practice-repo.test.ts), just for links that
 *  aren't under the practice repository at all. */
export const setupToolLinks = {
  githubSignup: "https://github.com/signup",
  vscode: "https://code.visualstudio.com",
  nodejs: "https://nodejs.org",
} as const;

export type FirstContributionStepLink = {
  label: string;
  href: string;
};

export type FirstContributionStep = {
  slug: string;
  order: number;
  title: string;
  /** One-line framing shown at the top of the step. */
  intro: string;
  /** Short "what you'll learn" explanation. */
  whatYoullLearn: string;
  /** Concrete "do this" instructions, rendered as a list. */
  doThis: string[];
  /** Optional shell/git command(s) shown as a code block. */
  code?: string;
  /** Optional hands-on prompt ("try it"). */
  tryIt?: string;
  /** Optional checklist of sub-tasks for this step. */
  checklist?: string[];
  /** Optional simple self-check for the learner. */
  checkYourWork?: string;
  /** Optional CTA links to the real practice repository on GitHub. */
  links?: FirstContributionStepLink[];
  /** Purely decorative color, cycling through the journey — see
   *  lib/first-contribution/step-accent.ts. */
  accent: FirstContributionAccent;
  /** Purely decorative icon shown on the step badge and page header. A name,
   *  not a component reference — see lib/first-contribution/step-icon.ts for
   *  why. */
  icon: FirstContributionStepIconName;
};

export const firstContributionSteps: readonly FirstContributionStep[] = [
  {
    slug: "understand-open-source",
    order: 1,
    title: "Understand Open Source",
    intro:
      "Every open source contribution runs on the same handful of ideas. Learn them once and they apply everywhere.",
    whatYoullLearn:
      "Open source means the code is public and anyone can propose a change to it. A repository (\"repo\") is the project's home: all its code and history live there. An issue is a tracked piece of work: a bug, a feature request, a question. A pull request (PR) is a proposed change, submitted for review. A maintainer owns the project and decides what gets merged. A contributor is anyone who submits a change, and by the end of this, that's you.",
    doThis: [
      "Read the practice repository's README end to end.",
      "Open its Issues tab and read three or four issues, comments included.",
      "Find one closed, merged pull request and skim what actually changed.",
    ],
    tryIt:
      "Pick one open issue and describe, in a sentence, what it's asking someone to do.",
    checkYourWork:
      "You can explain the difference between an issue and a pull request, and say who decides whether a pull request gets merged.",
    links: [
      { label: "Open Repository", href: practiceRepoLinks.repository },
      { label: "View Issues", href: practiceRepoLinks.issues },
      { label: "View Pull Requests", href: practiceRepoLinks.pullRequests },
    ],
    accent: "blue",
    icon: "book-open",
  },
  {
    slug: "set-up-your-tools",
    order: 2,
    title: "Set Up Your Tools",
    intro:
      "A short setup checklist, and you're ready for everything else in this journey.",
    whatYoullLearn:
      "GitHub hosts repositories online and is where issues, reviews, and pull requests happen. Git is the version control tool on your computer that talks to GitHub. A code editor is where you'll actually open and change files: any will do, but VS Code is a solid free default if you don't already have one. npm runs the practice repository's test suite in Step 6, so it's worth confirming separately from Git. You'll use a handful of Git commands later (clone, checkout, add, commit, push), each one introduced right when you need it, not all at once.",
    doThis: [
      "Install Git if you don't already have it (git-scm.com has installers for every OS).",
      "Create a GitHub account if you don't have one.",
      "Install a code editor if you don't already have one. VS Code is a solid free default.",
      "Install Node.js if you don't already have it. This also installs npm, which you'll use in Step 6.",
      "Confirm Git and Node are both working.",
    ],
    code: "git --version\nnode --version\nnpm --version",
    tryIt: "Run the commands above in your terminal and confirm each one prints a version number.",
    checklist: [
      "Git installed",
      "GitHub account created",
      "Code editor installed",
      "Node.js installed",
    ],
    checkYourWork:
      "`git --version`, `node --version`, and `npm --version` each print a version number. None of them say \"command not found\".",
    links: [
      { label: "Create GitHub Account", href: setupToolLinks.githubSignup },
      { label: "Download VS Code", href: setupToolLinks.vscode },
      { label: "Download Node.js", href: setupToolLinks.nodejs },
    ],
    accent: "violet",
    icon: "wrench",
  },
  {
    slug: "understand-a-repository",
    order: 3,
    title: "Understand a Repository",
    intro:
      "Before you touch any code, spend five minutes figuring out how the project is organized.",
    whatYoullLearn:
      "The README explains what a project does. CONTRIBUTING.md documents the exact workflow maintainers expect, so always read it before opening a pull request. Beyond that, a quick look at the folder structure, open issues, and past pull requests tells you almost everything else you need to get started.",
    doThis: [
      "Read the practice repository's README.",
      "Read CONTRIBUTING.md. It's the rulebook for how contributions get made here.",
      "Skim the `src/` and `tests/` folders so you know where code and tests live.",
      "Open a couple of past pull requests to see what a real one looks like.",
    ],
    tryIt:
      "Find the function `chunk()` in the repository, then find the test file that covers it.",
    checkYourWork:
      "You can say where the source code lives, where the tests live, and what command runs the tests.",
    links: [
      { label: "Open Repository", href: practiceRepoLinks.repository },
      { label: "Read CONTRIBUTING.md", href: practiceRepoLinks.contributing },
    ],
    accent: "pink",
    icon: "folder-tree",
  },
  {
    slug: "find-an-issue",
    order: 4,
    title: "Find an Issue",
    intro:
      "The right first issue is small and boring. That's a feature, not a problem.",
    whatYoullLearn:
      "A good first issue is small, clearly described, and doesn't require understanding the whole codebase. Avoid issues that are vague, already claimed by someone else, or that touch code you don't yet understand. There'll be time for those later. A fix-a-bug or fix-a-typo issue can only be done once, so if you're not the first person here, it may already be closed. That's normal, not a dead end: \"Add yourself to CONTRIBUTORS.md\" is designed to never run out, since everyone's addition is its own line and nobody's work conflicts with anyone else's.",
    doThis: [
      `Filter the practice repository's issues by the "${PRACTICE_ISSUE_LABEL}" label.`,
      "Read the full issue, including comments. Someone may already be working on it.",
      "Check that it has clear acceptance criteria before you commit to it.",
      "Nothing open and unclaimed? Look for \"Add yourself to CONTRIBUTORS.md\". It's always available, and it's a completely valid first pull request.",
    ],
    tryIt:
      "Pick one open, unclaimed issue and leave a comment saying you're working on it.",
    checkYourWork:
      "You've picked one issue, and you could explain to someone else exactly what \"done\" looks like for it.",
    links: [{ label: "View Good First Issues", href: practiceRepoLinks.goodFirstIssues }],
    accent: "orange",
    icon: "search",
  },
  {
    slug: "fork-the-repository",
    order: 5,
    title: "Fork the Repository",
    intro:
      "Fork, clone, branch: the same three moves that start every contribution you'll ever make.",
    whatYoullLearn:
      "Forking creates your own copy of the repository under your GitHub account. Cloning downloads your fork to your computer. Branching gives your change its own space, separate from `main`, so your work stays isolated until it's ready.",
    doThis: [
      "Click \"Fork\" on the practice repository.",
      "Clone your fork to your computer.",
      "Create a new branch for your change instead of working on `main`.",
    ],
    code: `git clone https://github.com/YOUR-USERNAME/${PRACTICE_REPO_NAME}.git\ncd ${PRACTICE_REPO_NAME}\ngit checkout -b fix-the-issue`,
    tryIt:
      "Run the commands above, swapping in your GitHub username and a branch name that describes your change.",
    checklist: ["Forked the repository", "Cloned it locally", "Created a new branch"],
    checkYourWork: "`git status` shows you're on your new branch, not `main`.",
    links: [{ label: "Fork Repository", href: practiceRepoLinks.fork }],
    accent: "teal",
    icon: "git-fork",
  },
  {
    slug: "make-your-change",
    order: 6,
    title: "Make Your Change",
    intro:
      "Make the smallest change that fully solves the issue, verify it, then get it onto GitHub.",
    whatYoullLearn:
      "How to make a focused change, confirm exactly what you've changed, and push it: stage with `git add`, commit with a clear message, then push the branch to your fork.",
    doThis: [
      "Make the change described in your issue, only what it asks for.",
      "Run the test suite to make sure nothing broke.",
      "Check what changed with `git status` and `git diff`.",
      "Stage, commit, and push.",
    ],
    code: 'npm test\n\ngit status\ngit add .\ngit commit -m "YOUR COMMIT MESSAGE HERE"\ngit push origin fix-the-issue',
    tryIt:
      "Work through the commands above in order, reading the output of each one before running the next.",
    checkYourWork:
      "`git status` shows a clean working tree, and your branch now appears on your fork on GitHub.",
    accent: "blue",
    icon: "code",
  },
  {
    slug: "open-your-pull-request",
    order: 7,
    title: "Open Your Pull Request",
    intro:
      "This is the moment your change goes from private to proposed.",
    whatYoullLearn:
      "A pull request proposes your change for review. A clear description (what changed, why, and which issue it closes) makes it easy for a maintainer to understand and approve without back-and-forth.",
    doThis: [
      "On GitHub, open your fork. You'll see a prompt to open a pull request against the original repository.",
      "Give it a clear, specific title.",
      "In the description, explain what you changed and why, and link the issue (e.g. \"Closes #4\").",
    ],
    tryIt:
      "Open your pull request and write a description a stranger could understand without asking you anything.",
    checkYourWork:
      "Your pull request is open and visible on the practice repository, linked to the issue it closes.",
    links: [{ label: "Open Pull Request", href: practiceRepoLinks.pullRequests }],
    accent: "violet",
    icon: "git-pull-request",
  },
  {
    slug: "handle-review",
    order: 8,
    title: "Handle Review",
    intro:
      "Review comments mean your pull request is being taken seriously, not that something went wrong.",
    whatYoullLearn:
      "Most pull requests get at least one round of feedback before merging. Responding to it is simple: make the requested changes on the same branch, then commit and push again. Your open pull request updates automatically, no need to open a new one.",
    doThis: [
      "Read any review comments carefully. Ask questions in the thread if something's unclear.",
      "Make requested changes on the same branch you already pushed.",
      "Commit and push again.",
    ],
    tryIt:
      "If you get feedback, respond to it and push an update. If not, that's fine too. Just wait for a maintainer to take a look.",
    checkYourWork:
      "Your pull request reflects the latest requested changes, and any review comments have a reply.",
    links: [{ label: "View Pull Requests", href: practiceRepoLinks.pullRequests }],
    accent: "pink",
    icon: "message-square",
  },
  {
    slug: "get-it-merged",
    order: 9,
    title: "Get It Merged",
    intro:
      "Approval, then merge: the two steps that turn your change into a permanent part of the project.",
    whatYoullLearn:
      "Once a maintainer approves your pull request, they merge it, folding your commits into `main`. From that point on, your change is part of the project's history: not a copy, not a suggestion, the actual code.",
    doThis: [
      "Wait for a maintainer to review and merge your pull request.",
      "Once merged, check that your commits now show up on `main`.",
    ],
    checkYourWork: "Your pull request shows a \"Merged\" badge on GitHub.",
    links: [{ label: "View Pull Requests", href: practiceRepoLinks.pullRequests }],
    accent: "orange",
    icon: "git-merge",
  },
  {
    slug: "real-project",
    order: 10,
    title: "Make Your First Real Contribution",
    intro:
      "You just did the entire workflow once. Every open source project on GitHub runs on the same one.",
    whatYoullLearn:
      "Fork, branch, change, pull request, review, merge. That's it, that's the whole thing, and it's identical everywhere. The practice repository was just a safe place to run it for the first time.",
    doThis: [
      "Browse Pull's open source project catalog for a repository that matches your skills and interests.",
      "Look for a real \"good first issue\" the same way you did in Step 4.",
    ],
    tryIt:
      "Open Pull's project discovery page and bookmark one repository you'd like to contribute to.",
    accent: "teal",
    icon: "rocket",
  },
] as const;

export function getFirstContributionStep(slug: string): FirstContributionStep | undefined {
  return firstContributionSteps.find((step) => step.slug === slug);
}

/** First step not yet in `completedSlugs`, or the last step if all are done. */
export function getNextIncompleteStep(completedSlugs: string[]): FirstContributionStep {
  return (
    firstContributionSteps.find((step) => !completedSlugs.includes(step.slug)) ??
    firstContributionSteps[firstContributionSteps.length - 1]
  );
}

export function getAdjacentSteps(slug: string) {
  const index = firstContributionSteps.findIndex((step) => step.slug === slug);
  if (index === -1) {
    return { previous: undefined, next: undefined };
  }
  return {
    previous: firstContributionSteps[index - 1],
    next: firstContributionSteps[index + 1],
  };
}
