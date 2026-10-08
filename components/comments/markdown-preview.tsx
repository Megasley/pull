"use client";

import { memo } from "react";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

import { CodeBlock } from "@/components/comments/code-block";
import { cn } from "@/lib/utils";

import "@/styles/comment-markdown.css";

/** URL protocol allowlist for comment content. */
const SAFE_PROTOCOLS = new Set(["http:", "https:", "mailto:"]);

function sanitizeUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;

  // Relative URLs are safe without a base.
  if (url.startsWith("/") || url.startsWith("#")) {
    return url;
  }

  // Absolute URLs — no window access, works on server and client.
  try {
    const parsed = new URL(url);
    if (SAFE_PROTOCOLS.has(parsed.protocol)) {
      return parsed.href;
    }
  } catch {
    // Invalid URL — drop it.
  }
  return undefined;
}

const components: Components = {
  // Unwrap <code> child to extract its className (language hint).
  pre: ({ children }) => {
    const child = Array.isArray(children) ? children[0] : children;
    if (child && typeof child === "object" && "props" in child) {
      const codeEl = child as React.ReactElement<{
        className?: string;
        children?: React.ReactNode;
      }>;
      return (
        <CodeBlock className={codeEl.props.className}>
          {codeEl.props.children}
        </CodeBlock>
      );
    }
    return <CodeBlock>{children}</CodeBlock>;
  },
  code: ({ className, children, ...props }) => {
    const isBlock = Boolean(className?.includes("language-"));
    if (isBlock) {
      return (
        <code className={className} {...props}>
          {children}
        </code>
      );
    }
    return (
      <code
        className="rounded-none border border-border bg-muted/60 px-1.5 py-0.5 font-mono text-[0.85em] text-foreground"
        {...props}
      >
        {children}
      </code>
    );
  },
  a: ({ href, children, ...props }) => {
    const safeHref = sanitizeUrl(href);
    if (!safeHref) {
      // URL rejected — render as plain text.
      return <>{children}</>;
    }
    return (
      <a
        href={safeHref}
        target="_blank"
        rel="noreferrer noopener"
        className="font-medium text-foreground underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground"
        {...props}
      >
        {children}
      </a>
    );
  },
  // No images — prevents SSRF and tracking pixels.
  img: () => null,
  blockquote: ({ className, ...props }) => (
    <blockquote
      className={cn(
        "my-3 border-l-2 border-border pl-4 italic text-muted-foreground",
        className,
      )}
      {...props}
    />
  ),
  ul: ({ className, ...props }) => (
    <ul className={cn("my-2 list-disc space-y-1 pl-6", className)} {...props} />
  ),
  ol: ({ className, ...props }) => (
    <ol className={cn("my-2 list-decimal space-y-1 pl-6", className)} {...props} />
  ),
  li: ({ className, ...props }) => (
    <li className={cn("leading-relaxed", className)} {...props} />
  ),
  p: ({ className, ...props }) => (
    <p className={cn("leading-relaxed text-sm", className)} {...props} />
  ),
  h1: ({ className, ...props }) => (
    <h1 className={cn("mt-3 text-base font-semibold text-foreground", className)} {...props} />
  ),
  h2: ({ className, ...props }) => (
    <h2 className={cn("mt-3 text-sm font-semibold text-foreground", className)} {...props} />
  ),
  h3: ({ className, ...props }) => (
    <h3 className={cn("mt-3 text-sm font-semibold text-foreground", className)} {...props} />
  ),
  hr: ({ className, ...props }) => (
    <hr className={cn("my-4 border-border", className)} {...props} />
  ),
  table: ({ className, ...props }) => (
    <div className="my-3 overflow-x-auto">
      <table className={cn("w-full border-collapse text-sm", className)} {...props} />
    </div>
  ),
  th: ({ className, ...props }) => (
    <th
      className={cn("border border-border bg-muted/40 px-3 py-1.5 text-left font-medium", className)}
      {...props}
    />
  ),
  td: ({ className, ...props }) => (
    <td className={cn("border border-border px-3 py-1.5", className)} {...props} />
  ),
};

type MarkdownPreviewProps = {
  content: string;
  className?: string;
};

/** Safe markdown renderer: no dangerouslySetInnerHTML, no rehype-raw (raw
 *  HTML is stripped), URL sanitization, images disabled, syntax highlighting
 *  via CSS classes. remark-breaks preserves line breaks for legacy comments. */
export const MarkdownPreview = memo(function MarkdownPreview({
  content,
  className,
}: MarkdownPreviewProps) {
  if (!content?.trim()) {
    return null;
  }

  return (
    <div className={cn("comment-markdown text-sm text-muted-foreground", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        rehypePlugins={[rehypeHighlight]}
        components={components}
        skipHtml
      >
        {content}
      </ReactMarkdown>
    </div>
  );
});
