export const DEFAULT_SATURATION_COEFFICIENT = 1.4;

export function saturate(
  raw: number,
  target: number,
  coefficient: number = DEFAULT_SATURATION_COEFFICIENT,
): number {
  if (raw <= 0 || target <= 0) return 0;
  const ratio = raw / target;
  return 1 - Math.exp(-coefficient * ratio);
}

export type ScoringStrength = "emerging" | "building" | "strong" | "exceptional";

export function strengthFromNormalized(normalized: number): ScoringStrength {
  if (normalized >= 0.85) return "exceptional";
  if (normalized >= 0.55) return "strong";
  if (normalized >= 0.25) return "building";
  return "emerging";
}

export function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export type SummaryFactorLike = {
  label: string;
  strengthPercent: number;
};

export type ScoreSummaryTemplates = {
  zero: string;
  early: (topLabel: string) => string;
  solid: (topLabel: string) => string;
  meaningful: (topLabel: string) => string;
  high: (topLabel: string) => string;
};

export function buildScoreSummary(
  score: number,
  factors: readonly SummaryFactorLike[],
  templates: ScoreSummaryTemplates,
): string {
  const sorted = [...factors].sort((a, b) => b.strengthPercent - a.strengthPercent);
  const top = sorted[0];
  const topLabel = top?.label ?? "";

  if (score === 0) return templates.zero;
  if (score < 25) return templates.early(topLabel);
  if (score < 50) return templates.solid(topLabel);
  if (score < 75) return templates.meaningful(topLabel);
  return templates.high(topLabel);
}
