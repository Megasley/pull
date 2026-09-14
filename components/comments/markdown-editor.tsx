"use client";

import { useCallback, useRef, useState } from "react";
import {
  Bold,
  ChevronRight,
  Code,
  Code2,
  Eye,
  Heading,
  Link as LinkIcon,
  List,
  ListOrdered,
  Quote,
  Pencil,
} from "lucide-react";

import { MarkdownPreview } from "@/components/comments/markdown-preview";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type MarkdownEditorProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  autoFocus?: boolean;
  id?: string;
};

type WrapInsert = {
  prefix: string;
  suffix: string;
  /** Text to insert if the selection is empty (placeholder). */
  placeholder?: string;
};

type LineInsert = {
  prefix: string;
};

function wrapSelectionCursor(
  text: string,
  start: number,
  end: number,
  opts: WrapInsert,
): { text: string; selectionStart: number; selectionEnd: number } {
  const selected = text.slice(start, end) || (opts.placeholder ?? "");
  const newText = text.slice(0, start) + opts.prefix + selected + opts.suffix + text.slice(end);
  const newStart = start + opts.prefix.length;
  const newEnd = newStart + selected.length;
  return { text: newText, selectionStart: newStart, selectionEnd: newEnd };
}

function prefixLines(
  text: string,
  start: number,
  end: number,
  opts: LineInsert,
): { text: string; selectionStart: number; selectionEnd: number } {
  // Expand selection to line boundaries
  const lineStart = text.lastIndexOf("\n", start - 1) + 1;
  const lineEnd = end < text.length && text[end] === "\n" ? end : end;

  const block = text.slice(lineStart, lineEnd);
  const lines = block.split("\n");
  const prefixed = lines.map((line, i) => {
    // For ordered lists, number each line
    if (opts.prefix === "1. ") {
      return `${i + 1}. ${line}`;
    }
    return `${opts.prefix}${line}`;
  });

  const newText =
    text.slice(0, lineStart) + prefixed.join("\n") + text.slice(lineEnd);

  return {
    text: newText,
    selectionStart: lineStart,
    selectionEnd: lineStart + prefixed.join("\n").length,
  };
}

const TOOLBAR_GROUPS: {
  tools: { icon: React.ElementType; label: string; action: string }[];
}[] = [
  {
    tools: [
      { icon: Bold, label: "Bold", action: "bold" },
      { icon: Code, label: "Inline code", action: "inline-code" },
      { icon: LinkIcon, label: "Link", action: "link" },
    ],
  },
  {
    tools: [
      { icon: Heading, label: "Heading", action: "heading" },
      { icon: Quote, label: "Blockquote", action: "blockquote" },
    ],
  },
  {
    tools: [
      { icon: List, label: "Bullet list", action: "ul" },
      { icon: ListOrdered, label: "Numbered list", action: "ol" },
    ],
  },
  {
    tools: [{ icon: Code2, label: "Code block", action: "code-block" }],
  },
];

export function MarkdownEditor({
  value,
  onChange,
  placeholder,
  rows = 3,
  disabled = false,
  autoFocus = false,
  id,
}: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showPreview, setShowPreview] = useState(false);

  const applyAction = useCallback(
    (action: string) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const { selectionStart: start, selectionEnd: end } = textarea;

      let result:
        | { text: string; selectionStart: number; selectionEnd: number }
        | null = null;

      switch (action) {
        case "bold":
          result = wrapSelectionCursor(value, start, end, {
            prefix: "**",
            suffix: "**",
            placeholder: "bold text",
          });
          break;
        case "inline-code":
          result = wrapSelectionCursor(value, start, end, {
            prefix: "`",
            suffix: "`",
            placeholder: "code",
          });
          break;
        case "link": {
          const selected = value.slice(start, end) || "link text";
          const insert = `[${selected}](https://)`;
          const newText = value.slice(0, start) + insert + value.slice(end);
          // Place cursor on the URL
          const urlStart = start + selected.length + 3;
          result = {
            text: newText,
            selectionStart: urlStart,
            selectionEnd: urlStart + 8,
          };
          break;
        }
        case "heading":
          result = prefixLines(value, start, end, { prefix: "### " });
          break;
        case "blockquote":
          result = prefixLines(value, start, end, { prefix: "> " });
          break;
        case "ul":
          result = prefixLines(value, start, end, { prefix: "- " });
          break;
        case "ol":
          result = prefixLines(value, start, end, { prefix: "1. " });
          break;
        case "code-block": {
          const selected = value.slice(start, end) || "code here";
          const insert = `\n\`\`\`ts\n${selected}\n\`\`\`\n`;
          const newText = value.slice(0, start) + insert + value.slice(end);
          const codeStart = start + 6; // after ```ts\n
          result = {
            text: newText,
            selectionStart: codeStart,
            selectionEnd: codeStart + selected.length,
          };
          break;
        }
      }

      if (!result) return;

      onChange(result.text);

      // Restore selection after React re-renders
      requestAnimationFrame(() => {
        textarea.focus();
        textarea.setSelectionRange(result!.selectionStart, result!.selectionEnd);
      });
    },
    [value, onChange],
  );

  function handlePaste(event: React.ClipboardEvent<HTMLTextAreaElement>) {
    // Preserve formatting from pasted rich text: browsers put an HTML
    // representation on the clipboard. We extract plain text which for
    // code pastes preserves newlines/indentation — the user can then
    // apply markdown formatting via the toolbar.
    //
    // If the user pastes markdown source (e.g. from another comment),
    // it flows through as-is and renders correctly in preview.
    const html = event.clipboardData.getData("text/html");
    if (!html) return; // plain text paste — let the browser handle it

    event.preventDefault();
    // Convert HTML to markdown-ish plain text: preserve line breaks
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;

    // Convert <br> and block elements to newlines, <code> to backticks
    tempDiv.querySelectorAll("br").forEach((br) => br.replaceWith("\n"));
    tempDiv.querySelectorAll("p, div, li").forEach((el) => {
      el.append("\n");
    });
    tempDiv.querySelectorAll("pre").forEach((el) => {
      const code = el.querySelector("code");
      const lang = code?.className?.match(/language-(\w+)/)?.[1] ?? "";
      const text = (code ?? el).textContent ?? "";
      el.replaceWith(`\n\`\`\`${lang}\n${text}\n\`\`\`\n`);
    });
    tempDiv.querySelectorAll("code").forEach((el) => {
      if (!el.closest("pre")) {
        el.replaceWith(`\`${el.textContent ?? ""}\``);
      }
    });
    tempDiv.querySelectorAll("strong, b").forEach((el) => {
      el.replaceWith(`**${el.textContent ?? ""}**`);
    });
    tempDiv.querySelectorAll("em, i").forEach((el) => {
      el.replaceWith(`*${el.textContent ?? ""}*`);
    });
    tempDiv.querySelectorAll("a").forEach((el) => {
      const href = el.getAttribute("href") ?? "";
      el.replaceWith(`[${el.textContent ?? ""}](${href})`);
    });
    tempDiv.querySelectorAll("blockquote").forEach((el) => {
      const lines = (el.textContent ?? "").split("\n").map((l) => `> ${l}`);
      el.replaceWith(`\n${lines.join("\n")}\n`);
    });
    tempDiv.querySelectorAll("ul").forEach((ul) => {
      const items = Array.from(ul.querySelectorAll("li"))
        .map((li) => `- ${li.textContent ?? ""}`)
        .join("\n");
      ul.replaceWith(`\n${items}\n`);
    });
    tempDiv.querySelectorAll("ol").forEach((ol) => {
      const items = Array.from(ol.querySelectorAll("li"))
        .map((li, i) => `${i + 1}. ${li.textContent ?? ""}`)
        .join("\n");
      ol.replaceWith(`\n${items}\n`);
    });

    const text = tempDiv.textContent ?? "";
    const textarea = event.currentTarget;
    const { selectionStart: start, selectionEnd: end } = textarea;
    const newText = value.slice(0, start) + text + value.slice(end);
    onChange(newText);

    requestAnimationFrame(() => {
      textarea.focus();
      const pos = start + text.length;
      textarea.setSelectionRange(pos, pos);
    });
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Ctrl/Cmd+B for bold, Ctrl/Cmd+` for inline code, Ctrl/Cmd+K for link
    if (!(event.ctrlKey || event.metaKey)) return;
    const key = event.key.toLowerCase();
    if (key === "b") {
      event.preventDefault();
      applyAction("bold");
    } else if (key === "`") {
      event.preventDefault();
      applyAction("inline-code");
    } else if (key === "k") {
      event.preventDefault();
      applyAction("link");
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1 border-b border-border/60 pb-1.5">
        {TOOLBAR_GROUPS.map((group, gi) => (
          <div key={gi} className="flex items-center gap-0.5">
            {gi > 0 ? (
              <span className="mx-1 h-4 w-px bg-border" aria-hidden />
            ) : null}
            {group.tools.map((tool) => (
              <Button
                key={tool.action}
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => applyAction(tool.action)}
                disabled={disabled}
                aria-label={tool.label}
                title={tool.label}
              >
                <tool.icon className="size-3" aria-hidden />
              </Button>
            ))}
          </div>
        ))}
        <span className="ml-auto h-4 w-px bg-border" aria-hidden />
        <Button
          type="button"
          variant="ghost"
          size="xs"
          onClick={() => setShowPreview((prev) => !prev)}
          disabled={disabled}
          aria-label={showPreview ? "Switch to edit mode" : "Switch to preview"}
        >
          {showPreview ? (
            <>
              <Pencil className="size-3" aria-hidden />
              Edit
            </>
          ) : (
            <>
              <Eye className="size-3" aria-hidden />
              Preview
            </>
          )}
        </Button>
      </div>

      <div
        className={cn(
          "grid gap-2",
          showPreview ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1",
        )}
      >
        <textarea
          ref={textareaRef}
          id={id}
          rows={rows}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onPaste={handlePaste}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          className={cn(
            "w-full resize-y rounded-none border border-border bg-transparent px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
            showPreview && "hidden sm:block",
          )}
        />
        {showPreview ? (
          <div className="min-h-[5rem] rounded-none border border-border bg-card px-3 py-2">
            {value.trim() ? (
              <MarkdownPreview content={value} />
            ) : (
              <p className="text-sm text-muted-foreground italic">Nothing to preview yet.</p>
            )}
          </div>
        ) : null}
      </div>

      {!showPreview && value.trim() ? (
        <details className="group">
          <summary className="flex cursor-pointer items-center gap-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground">
            <ChevronRight className="size-3 transition-transform group-open:rotate-90" aria-hidden />
            Quick preview
          </summary>
          <div className="mt-2 rounded-none border border-border bg-card px-3 py-2">
            <MarkdownPreview content={value} />
          </div>
        </details>
      ) : null}
    </div>
  );
}
