import { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

type OgCardProps = {
  eyebrow: string;
  title: string;
  subtitle?: string;
  footer?: string;
  meta?: string;
};

export function renderOgCard({ eyebrow, title, subtitle, footer, meta }: OgCardProps) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px",
          background: "#c8f231",
          color: "#231e1e",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 28,
            opacity: 0.7,
          }}
        >
          <span style={{ fontWeight: 700, letterSpacing: "-0.04em" }}>Pull</span>
          {meta ? <span style={{ fontSize: 22 }}>{meta}</span> : null}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", fontSize: 24, opacity: 0.7, letterSpacing: "0.08em" }}>
            {eyebrow.toUpperCase()}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 64,
              fontWeight: 700,
              letterSpacing: "-0.04em",
              lineHeight: 0.95,
              maxWidth: 1000,
            }}
          >
            {title}
          </div>
          {subtitle ? (
            <div
              style={{
                display: "flex",
                fontSize: 28,
                opacity: 0.75,
                maxWidth: 900,
                lineHeight: 1.25,
              }}
            >
              {subtitle}
            </div>
          ) : null}
        </div>
        {footer ? (
          <div style={{ display: "flex", fontSize: 24, opacity: 0.85 }}>{footer}</div>
        ) : null}
      </div>
    ),
    { ...OG_SIZE },
  );
}

export function ogImageUrl(path: string, baseUrl: string) {
  const normalized = path.endsWith("/opengraph-image") ? path : `${path}/opengraph-image`;
  return `${baseUrl}${normalized}`;
}
