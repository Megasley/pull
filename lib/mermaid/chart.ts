export function adaptChartForViewport(chart: string, preferVertical: boolean): string {
  if (!preferVertical) {
    return chart;
  }

  return chart.replace(/^flowchart\s+LR\b/im, "flowchart TB");
}
