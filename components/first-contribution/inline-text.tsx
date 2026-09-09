/**
 * Renders `` `backtick` `` spans in step copy as styled inline code,
 * matching the treatment MDX lesson content gets for inline code (see
 * components/mdx/mdx-components.tsx). Step content (lib/first-contribution/steps.ts)
 * is plain strings, not MDX, so this is the lightweight equivalent for the
 * one thing it needs — inline code — without pulling in a markdown parser
 * for a handful of `git status`-style references.
 */
export function InlineText({ text }: { text: string }) {
  const parts = text.split(/(`[^`]+`)/g);

  return (
    <>
      {parts.map((part, index) =>
        part.startsWith("`") && part.endsWith("`") && part.length > 1 ? (
          <code
            key={index}
            className="rounded-none border border-border bg-muted/60 px-1.5 py-0.5 font-mono text-[0.85em] text-foreground"
          >
            {part.slice(1, -1)}
          </code>
        ) : (
          part
        ),
      )}
    </>
  );
}
