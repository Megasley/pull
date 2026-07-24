/**
 * Backfill study-plan frontmatter (reflectionPrompts + lab) on lessons that lack them.
 * Safe to re-run: skips files that already define reflectionPrompts and lab.
 *
 * Usage: npx tsx scripts/retrofit-lesson-study-plans.ts
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import matter from "gray-matter";

import { getAllLessonSlugs } from "../lib/content/load-lessons";
import { getLessonFilePath } from "../lib/content/paths";

function defaultPrompts(title: string, roadmap: string): string[] {
  return [
    `Explain ${title} to a teammate without jargon — what problem does it solve?`,
    `What would break in production if you misunderstood ${title}?`,
    roadmap === "lightning"
      ? "Which BOLT (or implementation doc) is the source of truth for this topic, and what did you verify there?"
      : "Which BIP, book chapter, or Core doc is authoritative here, and what did you verify?",
  ];
}

function defaultLab(title: string, roadmap: string, slug: string) {
  const isProject = slug.startsWith("project-") || slug.startsWith("ln-project-");
  const isOss = slug.startsWith("oss-") || slug.startsWith("ln-contrib-");

  if (isProject) {
    return {
      title: "Project milestone evidence",
      description: `For ${title}, complete the linked project spec happy path on regtest/Polar and capture demo evidence before marking the lesson complete.`,
      evidence: [
        "Link to public repo or branch",
        "Commands or screenshots proving the happy path",
        "Short note of one failure case you tested",
      ],
    };
  }

  if (isOss) {
    return {
      title: "Contribution artifact",
      description: `Produce a contribution artifact for ${title}: issue shortlist, review notes, or PR draft that a maintainer could act on.`,
      evidence: [
        "Issue URL(s) or PR URL",
        "Written approach / review checklist",
        "Self-score against the meaningful-PR rubric",
      ],
    };
  }

  return {
    title: `${roadmap === "lightning" ? "Polar" : "Regtest"} check`,
    description: `After reading, run one hands-on check related to ${title}. Prefer local regtest or Polar over mainnet.`,
    evidence: [
      "Command output or screenshot from your local lab",
      "One sentence on what you observed vs expected",
      "Link to the required reading section you used",
    ],
  };
}

function main() {
  const slugs = getAllLessonSlugs();
  let updated = 0;
  let skipped = 0;

  for (const { roadmap, lesson } of slugs) {
    const filePath = getLessonFilePath(roadmap, lesson);
    const raw = readFileSync(filePath, "utf8");
    const parsed = matter(raw);
    const data = parsed.data as Record<string, unknown>;
    const title =
      typeof data.title === "string" ? data.title : lesson.replace(/-/g, " ");

    const hasPrompts =
      Array.isArray(data.reflectionPrompts) && data.reflectionPrompts.length > 0;
    const hasLab =
      data.lab != null &&
      typeof data.lab === "object" &&
      !Array.isArray(data.lab) &&
      typeof (data.lab as { title?: unknown }).title === "string";

    if (hasPrompts && hasLab) {
      skipped += 1;
      continue;
    }

    if (!hasPrompts) {
      data.reflectionPrompts = defaultPrompts(title, roadmap);
    }
    if (!hasLab) {
      data.lab = defaultLab(title, roadmap, lesson);
    }

    // Mark first book/bip/bolt resource as required when none are marked.
    if (Array.isArray(data.resources)) {
      const resources = data.resources as Array<Record<string, unknown> | string>;
      const anyRequired = resources.some(
        (item) => typeof item === "object" && item && item.required === true,
      );
      if (!anyRequired) {
        for (const item of resources) {
          if (typeof item !== "object" || !item) continue;
          const kind = item.kind;
          if (kind === "book" || kind === "bip" || kind === "bolt" || item.chapter) {
            item.required = true;
            break;
          }
        }
      }
    }

    const next = matter.stringify(parsed.content.trimStart(), data);
    writeFileSync(filePath, next.endsWith("\n") ? next : `${next}\n`, "utf8");
    updated += 1;
    console.log("updated", path.relative(process.cwd(), filePath));
  }

  console.log(`done: updated=${updated} skipped=${skipped} total=${slugs.length}`);
}

main();
