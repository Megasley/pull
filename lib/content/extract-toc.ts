import GithubSlugger from "github-slugger";

import type { TocItem } from "@/types/content";

export function extractToc(markdown: string): TocItem[] {
  const slugger = new GithubSlugger();
  const toc: TocItem[] = [];

  for (const line of markdown.split("\n")) {
    const match = line.match(/^(#{2,3})\s+(.+?)\s*#*$/);

    if (!match) {
      continue;
    }

    const depth = match[1].length as 2 | 3;
    const title = match[2].trim();

    toc.push({
      depth,
      title,
      id: slugger.slug(title),
    });
  }

  return toc;
}
