"use client";

import { useCallback, useState } from "react";
import { Check, ChevronDown, ChevronRight, Copy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CodeBlockProps = {
  children: React.ReactNode;
  className?: string;
};

const COLLAPSE_THRESHOLD = 12;

function extractLanguage(className?: string): string | null {
  if (!className) return null;
  const match = /language-(\w+)/.exec(className);
  return match?.[1] ?? null;
}

function extractText(node: React.ReactNode): string {
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (node && typeof node === "object" && "props" in node) {
    const props = (node as React.ReactElement).props as { children?: React.ReactNode };
    return extractText(props.children);
  }
  return "";
}

export function CodeBlock({ children, className }: CodeBlockProps) {
  const language = extractLanguage(className);
  const rawText = extractText(children);
  const lineCount = rawText.split("\n").length;
  const canCollapse = lineCount > COLLAPSE_THRESHOLD;

  const [collapsed, setCollapsed] = useState(true);
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(rawText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard may be unavailable (permissions/secure context); fail silently
    }
  }, [rawText]);

  return (
    <div className="comment-code-block group/code my-3 overflow-hidden rounded-none border border-border bg-[#0d1117]">
      <div className="flex items-center justify-between border-b border-border/60 bg-muted/30 px-3 py-1.5">
        <div className="flex items-center gap-2">
          {canCollapse ? (
            <button
              type="button"
              onClick={() => setCollapsed((prev) => !prev)}
              className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
              aria-expanded={!collapsed}
              aria-label={collapsed ? "Expand code block" : "Collapse code block"}
            >
              {collapsed ? (
                <ChevronRight className="size-3" aria-hidden />
              ) : (
                <ChevronDown className="size-3" aria-hidden />
              )}
              {language ?? "code"}
            </button>
          ) : (
            <span className="text-[11px] font-medium text-muted-foreground">
              {language ?? "code"}
            </span>
          )}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={copy}
          aria-label="Copy code"
          className="opacity-0 transition-opacity group-hover/code:opacity-100"
        >
          {copied ? (
            <Check className="size-3 text-foreground" aria-hidden />
          ) : (
            <Copy className="size-3" aria-hidden />
          )}
        </Button>
      </div>
      <div
        className={cn(
          "overflow-x-auto",
          canCollapse && collapsed && "max-h-[12rem]",
        )}
      >
        <pre className="m-0 p-4 text-sm text-[#e6edf3]">
          <code className={className}>{children}</code>
        </pre>
        {canCollapse && collapsed ? (
          <button
            type="button"
            onClick={() => setCollapsed(false)}
            className="block w-full border-t border-border/60 py-1.5 text-center text-[11px] text-muted-foreground transition-colors hover:text-foreground"
          >
            Show {lineCount} lines
          </button>
        ) : null}
      </div>
    </div>
  );
}
