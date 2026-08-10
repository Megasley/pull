import type { MDXComponents } from "mdx/types";

import { cn } from "@/lib/utils";

import { Callout } from "./callout";
import { LessonImage } from "./lesson-image";
import { Mermaid } from "./mermaid";
import { Video } from "./video";

export const mdxComponents: MDXComponents = {
  Callout,
  Video,
  LessonImage,
  Mermaid,
  h1: ({ className, ...props }) => (
    <h1
      className={cn(
        "mt-10 scroll-mt-24 text-3xl font-semibold tracking-tight text-foreground first:mt-0",
        className,
      )}
      {...props}
    />
  ),
  h2: ({ className, ...props }) => (
    <h2
      className={cn(
        "mt-10 scroll-mt-24 text-2xl font-semibold tracking-tight text-foreground",
        className,
      )}
      {...props}
    />
  ),
  h3: ({ className, ...props }) => (
    <h3
      className={cn(
        "mt-8 scroll-mt-24 text-xl font-semibold tracking-tight text-foreground",
        className,
      )}
      {...props}
    />
  ),
  p: ({ className, ...props }) => (
    <p
      className={cn(
        "leading-7 text-muted-foreground [&:not(:first-child)]:mt-4",
        className,
      )}
      {...props}
    />
  ),
  ul: ({ className, ...props }) => (
    <ul
      className={cn("my-4 list-disc space-y-2 pl-6 text-muted-foreground", className)}
      {...props}
    />
  ),
  ol: ({ className, ...props }) => (
    <ol
      className={cn(
        "my-4 list-decimal space-y-2 pl-6 text-muted-foreground",
        className,
      )}
      {...props}
    />
  ),
  li: ({ className, ...props }) => (
    <li className={cn("leading-7", className)} {...props} />
  ),
  a: ({ className, ...props }) => (
    <a
      className={cn(
        "font-medium text-foreground underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground",
        className,
      )}
      {...props}
    />
  ),
  blockquote: ({ className, ...props }) => (
    <blockquote
      className={cn(
        "my-6 border-l-2 border-border pl-4 text-muted-foreground italic",
        className,
      )}
      {...props}
    />
  ),
  hr: ({ className, ...props }) => (
    <hr className={cn("my-10 border-border", className)} {...props} />
  ),
  pre: ({ className, ...props }) => (
    <pre
      className={cn(
        "my-6 overflow-x-auto rounded-none border border-border bg-[#0d1117] p-4 text-sm text-[#e6edf3]",
        className,
      )}
      {...props}
    />
  ),
  code: ({ className, ...props }) => {
    const isBlock = Boolean(className?.includes("language-"));

    if (isBlock) {
      return (
        <code
          className={cn(
            "bg-transparent p-0 font-mono text-[0.85em] text-inherit",
            className,
          )}
          {...props}
        />
      );
    }

    return (
      <code
        className={cn(
          "rounded-none border border-border bg-muted/60 px-1.5 py-0.5 font-mono text-[0.85em] text-foreground",
          className,
        )}
        {...props}
      />
    );
  },
  table: ({ className, ...props }) => (
    <div className="my-6 overflow-x-auto">
      <table
        className={cn(
          "w-full border-collapse text-sm text-muted-foreground",
          className,
        )}
        {...props}
      />
    </div>
  ),
  th: ({ className, ...props }) => (
    <th
      className={cn(
        "border border-border bg-muted/40 px-3 py-2 text-left font-medium text-foreground",
        className,
      )}
      {...props}
    />
  ),
  td: ({ className, ...props }) => (
    <td className={cn("border border-border px-3 py-2", className)} {...props} />
  ),
};
