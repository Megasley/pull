/**
 * Backfill searchQueries on lessons from BIP/BOLT resource titles.
 * Skips files that already define searchQueries.
 *
 * Usage: npx tsx scripts/retrofit-lesson-search-queries.ts
 */
import { readFileSync, writeFileSync } from "node:fs";

import matter from "gray-matter";

import { getAllLessonSlugs } from "../lib/content/load-lessons";
import { getLessonFilePath } from "../lib/content/paths";
import { resolveSearchQueries } from "../types/content";

/** Curated extras when auto-harvest is thin or titles are better search terms. */
const CURATED: Record<string, string[]> = {
  "bitcoin/dev-psbt": ["BIP174", "PSBT"],
  "bitcoin/basics-taproot": ["BIP341", "BIP340", "Taproot"],
  "bitcoin/foundations-crypto": ["BIP340", "Schnorr"],
  "bitcoin/dev-descriptors": ["BIP380", "output descriptors"],
  "bitcoin/basics-segwit": ["BIP141", "SegWit"],
  "bitcoin/basics-keys": ["BIP32", "BIP39"],
  "bitcoin/basics-multisig": ["multisig", "BIP67"],
  "bitcoin/basics-mempool": ["mempool", "BIP125"],
  "bitcoin/basics-soft-forks": ["soft fork", "BIP9"],
  "lightning/ln-bolts": ["BOLT", "Lightning Network"],
  "lightning/ln-onion": ["BOLT4", "onion routing"],
  "lightning/ln-invoices": ["BOLT11", "Lightning invoice"],
  "lightning/ln-offers": ["BOLT12", "Lightning offers"],
  "lightning/ln-transport": ["Noise protocol", "Lightning transport"],
  "lightning/ln-attacks": ["Lightning attack surface", "channel jamming"],
};

function main() {
  const slugs = getAllLessonSlugs();
  let updated = 0;
  let skipped = 0;

  for (const { roadmap, lesson } of slugs) {
    const filePath = getLessonFilePath(roadmap, lesson);
    const raw = readFileSync(filePath, "utf8");
    const parsed = matter(raw);
    const data = parsed.data as Record<string, unknown>;

    if (Array.isArray(data.searchQueries) && data.searchQueries.length > 0) {
      skipped += 1;
      continue;
    }

    const key = `${roadmap}/${lesson}`;
    const curated = CURATED[key];
    const resolved = resolveSearchQueries({
      title: typeof data.title === "string" ? data.title : lesson,
      resources: data.resources as never,
      requiredReading: data.requiredReading as never,
      searchQueries: curated,
    });

    // Only persist when we have something better than a lone title fallback,
    // or when curated is set.
    const title =
      typeof data.title === "string" ? data.title : lesson.replace(/-/g, " ");
    const isTitleOnly =
      resolved.length === 1 && resolved[0] === title && !curated;

    if (isTitleOnly || resolved.length === 0) {
      skipped += 1;
      continue;
    }

    // Normalize BIP### zero-padding if re-running over existing values
    data.searchQueries = resolved.map((q) =>
      q.replace(/^BIP0+(\d+)$/i, (_, n) => `BIP${Number.parseInt(n, 10)}`).replace(
        /^BOLT0+(\d+)$/i,
        (_, n) => `BOLT${Number.parseInt(n, 10)}`,
      ),
    );
    const next = matter.stringify(parsed.content, data);
    writeFileSync(filePath, next.endsWith("\n") ? next : `${next}\n`);
    updated += 1;
    console.log(`updated ${key}: ${resolved.join(", ")}`);
  }

  console.log(`\nDone. updated=${updated} skipped=${skipped}`);
}

main();
