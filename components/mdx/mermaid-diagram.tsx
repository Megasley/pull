"use client";

import { useEffect, useId, useRef, useState } from "react";

import { adaptChartForViewport } from "@/lib/mermaid/chart";
import { getMermaid } from "@/lib/mermaid/init";
import { normalizeMermaidSvg } from "@/lib/mermaid/normalize-svg";
import { cn } from "@/lib/utils";

type MermaidDiagramProps = {
  chart: string;
  caption?: string;
  className?: string;
};

function usePreferVerticalChart() {
  const [preferVertical, setPreferVertical] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");

    const update = () => {
      setPreferVertical(media.matches);
    };

    update();
    media.addEventListener("change", update);

    return () => {
      media.removeEventListener("change", update);
    };
  }, []);

  return preferVertical;
}

export function MermaidDiagram({
  chart,
  caption,
  className,
}: MermaidDiagramProps) {
  const reactId = useId().replace(/:/g, "");
  const renderSeq = useRef(0);
  const source = chart.trim();
  const preferVertical = usePreferVerticalChart();
  const chartSource = adaptChartForViewport(source, preferVertical);
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const renderId = `mermaid-${reactId}-${renderSeq.current++}`;

    async function renderChart() {
      if (!chartSource) {
        setError("Diagram source is empty.");
        setSvg(null);
        return;
      }

      try {
        const mermaid = await getMermaid();
        const { svg: rendered } = await mermaid.render(renderId, chartSource);

        if (!cancelled) {
          setSvg(normalizeMermaidSvg(rendered));
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to render diagram",
          );
          setSvg(null);
        }
      }
    }

    void renderChart();

    return () => {
      cancelled = true;
    };
  }, [chartSource, reactId]);

  return (
    <figure className={cn("my-8 not-prose", className)}>
      <div className="mermaid-frame rounded-none border border-border p-4 sm:p-6">
        {error ? (
          <pre className="mermaid-error whitespace-pre-wrap font-mono text-sm">
            {error}
          </pre>
        ) : svg ? (
          <div
            className="mermaid-svg mermaid"
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        ) : (
          <p className="text-center text-sm text-muted-foreground">
            Loading diagram…
          </p>
        )}
      </div>
      {caption ? (
        <figcaption className="mt-3 text-center text-sm text-muted-foreground">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
