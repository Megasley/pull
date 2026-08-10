"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

import { cn } from "@/lib/utils";

type SupportQrCodeProps = {
  value: string;
  label: string;
  className?: string;
  size?: number;
};

type QrResult = {
  key: string;
  dataUrl?: string;
  error?: string;
};

export function SupportQrCode({
  value,
  label,
  className,
  size = 220,
}: SupportQrCodeProps) {
  const requestKey = `${value}:${size}`;
  const [result, setResult] = useState<QrResult | null>(null);
  const active = result?.key === requestKey ? result : null;

  useEffect(() => {
    let cancelled = false;

    void QRCode.toDataURL(value, {
      errorCorrectionLevel: "M",
      margin: 2,
      width: size,
      color: {
        dark: "#0a0a0a",
        light: "#ffffff",
      },
    })
      .then((url) => {
        if (!cancelled) setResult({ key: requestKey, dataUrl: url });
      })
      .catch(() => {
        if (!cancelled) {
          setResult({ key: requestKey, error: "Could not generate QR code." });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [value, size, requestKey]);

  if (active?.error) {
    return (
      <p className="font-mono text-xs text-destructive" role="alert">
        {active.error}
      </p>
    );
  }

  if (!active?.dataUrl) {
    return (
      <div
        className={cn("animate-pulse border border-border bg-muted/40", className)}
        style={{ width: size, height: size }}
        aria-hidden
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- dynamic data URL QR
    <img
      src={active.dataUrl}
      alt={label}
      width={size}
      height={size}
      className={cn("border border-border bg-white p-2", className)}
    />
  );
}
