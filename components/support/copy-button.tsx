"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CopyValueButtonProps = {
  value: string;
  label?: string;
  className?: string;
  size?: "default" | "sm" | "xs";
};

export function CopyValueButton({
  value,
  label = "Copy",
  className,
  size = "sm",
}: CopyValueButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this value:", value);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size={size}
      onClick={() => void handleCopy()}
      className={cn(className)}
    >
      {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
      {copied ? "Copied" : label}
    </Button>
  );
}
