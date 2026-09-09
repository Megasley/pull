import { describe, expect, it } from "vitest";

import {
  PRACTICE_ISSUE_LABEL,
  PRACTICE_REPO_FULL_NAME,
  PRACTICE_REPO_URL,
  practiceRepoLinks,
} from "@/lib/first-contribution/practice-repo";
import { firstContributionSteps, setupToolLinks } from "@/lib/first-contribution/steps";

describe("practice repository links", () => {
  it("derives every link from the same repository URL", () => {
    expect(PRACTICE_REPO_URL).toBe(`https://github.com/${PRACTICE_REPO_FULL_NAME}`);

    for (const href of Object.values(practiceRepoLinks)) {
      expect(href.startsWith(PRACTICE_REPO_URL)).toBe(true);
    }
  });

  it("filters the good-first-issues link by the Pull-specific practice-issue label, not the generic global one", () => {
    expect(practiceRepoLinks.goodFirstIssues).toContain(`label%3A${PRACTICE_ISSUE_LABEL}`);
    expect(practiceRepoLinks.goodFirstIssues).not.toContain("good+first+issue");
  });

  it("points fork at GitHub's fork endpoint", () => {
    expect(practiceRepoLinks.fork).toBe(`${PRACTICE_REPO_URL}/fork`);
  });
});

describe("step content stays centralized", () => {
  it("never hardcodes a github.com URL in descriptive copy outside the shared practice-repo config", () => {
    // step.code is excluded: it legitimately shows a literal `git clone
    // https://github.com/...` command as instructional example syntax.
    for (const step of firstContributionSteps) {
      const fields = [step.intro, step.whatYoullLearn, ...step.doThis, step.tryIt]
        .filter((value): value is string => Boolean(value))
        .join("\n");

      expect(fields).not.toMatch(/github\.com/);
    }
  });

  it("every step link resolves under the practice repository, or is a known external tool-setup link", () => {
    const externalToolLinks = new Set<string>(Object.values(setupToolLinks));

    for (const step of firstContributionSteps) {
      for (const link of step.links ?? []) {
        const isPracticeRepoLink = link.href.startsWith(PRACTICE_REPO_URL);
        const isKnownExternalToolLink = externalToolLinks.has(link.href);
        expect(isPracticeRepoLink || isKnownExternalToolLink).toBe(true);
      }
    }
  });
});
