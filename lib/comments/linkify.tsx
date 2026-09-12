import type { ReactNode } from "react";

const URL_PATTERN = /https?:\/\/[^\s<]+[^\s<.,;:!?)'"]/g;

/**
 * Turns bare URLs in plain text into real links, without ever touching
 * `dangerouslySetInnerHTML` — comment bodies are plain text (see plan §8:
 * no markdown/HTML rendering for v1), so this is pure string-splitting into
 * React nodes, not HTML parsing. Safe against injection because the input
 * is never interpreted as markup.
 */
export function linkifyText(text: string): ReactNode[] {
  const parts = text.split(URL_PATTERN);
  const matches = text.match(URL_PATTERN) ?? [];

  const nodes: ReactNode[] = [];
  parts.forEach((part, index) => {
    if (part) {
      nodes.push(part);
    }
    const url = matches[index];
    if (url) {
      nodes.push(
        <a
          key={`${url}-${index}`}
          href={url}
          target="_blank"
          rel="noreferrer noopener"
          className="underline underline-offset-2 hover:text-foreground"
        >
          {url}
        </a>,
      );
    }
  });

  return nodes;
}
