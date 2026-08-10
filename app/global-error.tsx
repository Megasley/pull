"use client";

import { useEffect } from "react";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error("[pull] global error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          background: "#c8f231",
          color: "#231e1e",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
        }}
      >
        <main
          style={{
            maxWidth: "42rem",
            margin: "0 auto",
            padding: "4rem 1.25rem",
          }}
        >
          <p
            style={{
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              fontSize: "11px",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              opacity: 0.65,
              margin: 0,
            }}
          >
            root layout // hard fault
          </p>
          <h1
            style={{
              fontSize: "clamp(3rem, 10vw, 5rem)",
              letterSpacing: "-0.04em",
              margin: "1rem 0 0.75rem",
            }}
          >
            500
          </h1>
          <p style={{ fontSize: "1.15rem", fontWeight: 600, margin: 0 }}>
            The app shell crashed
          </p>
          <p style={{ marginTop: "0.75rem", opacity: 0.8, lineHeight: 1.5 }}>
            A top-level error stopped the page from rendering. Retry, or reload from
            home.
          </p>
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "2rem" }}>
            <button
              type="button"
              onClick={reset}
              style={{
                border: "1px solid #231e1e",
                background: "#231e1e",
                color: "#f4f4ef",
                padding: "0.7rem 1.1rem",
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                fontSize: "12px",
                cursor: "pointer",
              }}
            >
              ./retry
            </button>
            {/* Root layout may be broken; plain <a> is required for a hard navigation. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/"
              style={{
                border: "1px solid #231e1e4d",
                background: "transparent",
                color: "#231e1e",
                padding: "0.7rem 1.1rem",
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                fontSize: "12px",
                textDecoration: "none",
              }}
            >
              cd ~
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
