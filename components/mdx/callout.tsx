import { AlertTriangle, Info, Lightbulb, ShieldAlert } from "lucide-react";

import { cn } from "@/lib/utils";

const calloutStyles = {
  info: {
    icon: Info,
    className: "border-border bg-muted/40 text-foreground",
    iconClassName: "text-ink",
  },
  tip: {
    icon: Lightbulb,
    className: "border-ink/20 bg-signal/15 text-foreground",
    iconClassName: "text-ink",
  },
  warning: {
    icon: AlertTriangle,
    className: "border-ink/30 bg-ink/5 text-foreground",
    iconClassName: "text-ink",
  },
  danger: {
    icon: ShieldAlert,
    className: "border-destructive/30 bg-destructive/10 text-foreground",
    iconClassName: "text-destructive",
  },
} as const;

type CalloutType = keyof typeof calloutStyles;

type CalloutProps = {
  type?: CalloutType;
  title?: string;
  children: React.ReactNode;
};

export function Callout({ type = "info", title, children }: CalloutProps) {
  const config = calloutStyles[type];
  const Icon = config.icon;

  return (
    <aside
      className={cn("my-6 rounded-none border px-4 py-4 not-prose", config.className)}
    >
      <div className="flex items-start gap-3">
        <Icon className={cn("mt-0.5 size-5 shrink-0", config.iconClassName)} />
        <div className="min-w-0 space-y-2">
          {title ? (
            <p className="font-mono text-[11px] tracking-[0.12em] text-foreground uppercase">
              {title}
            </p>
          ) : null}
          <div className="text-sm leading-6 text-muted-foreground [&_p]:m-0">
            {children}
          </div>
        </div>
      </div>
    </aside>
  );
}
