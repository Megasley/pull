import {
  Blocks,
  Bitcoin,
  Building2,
  CheckCircle2,
  Clock,
  Copy,
  Cpu,
  FileText,
  Hammer,
  Hourglass,
  KeyRound,
  Laptop,
  Network,
  PenLine,
  Server,
  ShieldCheck,
  User,
  Users,
  Wallet,
  XCircle,
} from "lucide-react";
import type { ComponentType, ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Small, server-safe building blocks for <Explainer> scenes. Lesson authors
 * compose them in MDX, so icons are picked by name to keep props plain strings.
 */
const icons: Record<string, ComponentType<{ className?: string }>> = {
  bank: Building2,
  bitcoin: Bitcoin,
  block: Blocks,
  check: CheckCircle2,
  clock: Clock,
  copy: Copy,
  cpu: Cpu,
  file: FileText,
  hourglass: Hourglass,
  key: KeyRound,
  laptop: Laptop,
  miner: Hammer,
  network: Network,
  node: Server,
  sign: PenLine,
  shield: ShieldCheck,
  user: User,
  users: Users,
  wallet: Wallet,
  x: XCircle,
};

type Tone = "default" | "signal" | "bad" | "muted";

type Delay = 0 | 1 | 2 | 3 | 4;

function popClass(delay: Delay | undefined) {
  return cn("ix-pop", delay ? `ix-d${delay}` : undefined);
}

export function Icon({ name, className }: { name: string; className?: string }) {
  const Glyph = icons[name] ?? FileText;
  return <Glyph className={className} aria-hidden />;
}

/** Horizontal row that wraps on narrow screens. */
export function Stage({ children }: { children: ReactNode }) {
  return <div className="ix-stage">{children}</div>;
}

/** Vertical group inside a Stage. */
export function Group({ children, delay }: { children: ReactNode; delay?: Delay }) {
  return <div className={cn("ix-stack", popClass(delay))}>{children}</div>;
}

/** A thing or a person in the scene: wallet, node, miner, Alice. */
export function Actor({
  icon,
  label,
  sub,
  tone = "default",
  delay,
}: {
  icon: string;
  label: string;
  sub?: string;
  tone?: Tone;
  delay?: Delay;
}) {
  return (
    <div className={cn("ix-actor", popClass(delay))} data-tone={tone}>
      <Icon name={icon} />
      <b>{label}</b>
      {sub ? <small>{sub}</small> : null}
    </div>
  );
}

/** Animated arrow between actors, with an optional label. */
export function Flow({
  label,
  tone = "default",
  delay,
}: {
  label?: string;
  tone?: Exclude<Tone, "signal" | "muted">;
  delay?: Delay;
}) {
  return (
    <div className={cn("ix-flow", popClass(delay))} data-tone={tone} aria-hidden>
      <span className="ix-flow-line" />
      {label ? <span>{label}</span> : null}
    </div>
  );
}

/** A coin or an amount of bitcoin. tone="muted" shows it as spent. */
export function Coin({
  label,
  tone = "default",
  delay,
}: {
  label: string;
  tone?: "default" | "muted";
  delay?: Delay;
}) {
  return (
    <span className={cn("ix-coin", popClass(delay))} data-tone={tone}>
      <Bitcoin className="size-3.5" aria-hidden />
      {label}
    </span>
  );
}

/**
 * Small label: a status, a rule, a value. Text goes in `label`, not children:
 * MDX wraps multi-line children in paragraphs.
 */
export function Pill({
  label,
  icon,
  tone = "default",
  delay,
}: {
  label: string;
  icon?: string;
  tone?: Exclude<Tone, "muted">;
  delay?: Delay;
}) {
  return (
    <span className={cn("ix-pill", popClass(delay))} data-tone={tone}>
      {icon ? <Icon name={icon} /> : null}
      {label}
    </span>
  );
}

/** One-line caption under a scene visual. */
export function Caption({ text, delay }: { text: string; delay?: Delay }) {
  return <p className={cn("ix-caption", popClass(delay))}>{text}</p>;
}
