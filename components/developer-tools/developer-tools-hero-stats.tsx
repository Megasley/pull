type DeveloperToolsHeroStatsProps = {
  toolsLabel: string;
  categoriesLabel: string;
  cadenceLabel: string;
};

export function DeveloperToolsHeroStats({
  toolsLabel,
  categoriesLabel,
  cadenceLabel,
}: DeveloperToolsHeroStatsProps) {
  const items = [
    { label: toolsLabel },
    { label: categoriesLabel },
    { label: cadenceLabel },
  ];

  return (
    <dl className="mt-8 flex flex-wrap gap-x-6 gap-y-2 border-t border-border pt-5 font-mono text-[11px] tracking-[0.08em] text-muted-foreground uppercase sm:gap-x-10">
      {items.map((item) => (
        <div key={item.label}>
          <dt className="sr-only">Stat</dt>
          <dd>{item.label}</dd>
        </div>
      ))}
    </dl>
  );
}
