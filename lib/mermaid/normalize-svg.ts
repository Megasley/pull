function parseLength(value: string | null): number | null {
  if (!value) {
    return null;
  }

  const parsed = Number.parseFloat(value.replace(/px$/, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

export function normalizeMermaidSvg(svg: string): string {
  if (typeof DOMParser === "undefined") {
    return svg;
  }

  const doc = new DOMParser().parseFromString(svg, "image/svg+xml");
  const root = doc.documentElement;

  if (root.tagName !== "svg") {
    return svg;
  }

  if (!root.getAttribute("viewBox")) {
    const width = parseLength(root.getAttribute("width"));
    const height = parseLength(root.getAttribute("height"));

    if (width && height) {
      root.setAttribute("viewBox", `0 0 ${width} ${height}`);
    }
  }

  root.removeAttribute("width");
  root.removeAttribute("height");
  root.removeAttribute("overflow");
  root.setAttribute("preserveAspectRatio", "xMidYMid meet");

  const style = (root.getAttribute("style") ?? "")
    .replace(/overflow\s*:\s*hidden\s*;?/gi, "")
    .replace(/max-width\s*:[^;]+;?/gi, "")
    .replace(/width\s*:[^;]+;?/gi, "")
    .replace(/height\s*:[^;]+;?/gi, "")
    .trim();

  root.setAttribute("style", [style, "overflow: visible"].filter(Boolean).join("; "));

  return new XMLSerializer().serializeToString(root);
}
