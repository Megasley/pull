"use client";

import { useState, useTransition } from "react";
import { Check, Copy, Share2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ShareProfileButtonProps = {
  url: string;
  label?: string;
  className?: string;
};

export function ShareProfileButton({
  url,
  label = "Copy share link",
  className,
}: ShareProfileButtonProps) {
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleShare() {
    startTransition(async () => {
      try {
        if (typeof navigator !== "undefined" && navigator.share) {
          await navigator.share({
            title: "Pull portfolio",
            url,
          });
          return;
        }
      } catch {
        // Fall through to clipboard when share is cancelled or unavailable.
      }

      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      } catch {
        window.prompt("Copy this profile link:", url);
      }
    });
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleShare}
      loading={pending}
      className={cn("w-full sm:w-auto", className)}
    >
      {copied ? <Check aria-hidden /> : <Share2 aria-hidden />}
      {copied ? "Copied" : label}
      {!copied && !pending ? (
        <Copy className="size-3.5 opacity-50" aria-hidden />
      ) : null}
    </Button>
  );
}
