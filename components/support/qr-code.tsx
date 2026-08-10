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

export function SupportQrCode({
  value,
  label,
  className,
  size = 220,
}: SupportQrCodeProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setDataUrl(null);
    setError(null);

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
        if (!cancelled) setDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setError("Could not generate QR code.");
      });

    return () => {
      cancelled = true;
    };
  }, [value, size]);

  if (error) {
    return (
      <p className="font-mono text-xs text-destructive" role="alert">
        {error}
      </p>
    );
  }

  if (!dataUrl) {
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
      src={dataUrl}
      alt={label}
      width={size}
      height={size}
      className={cn("border border-border bg-white p-2", className)}
    />
  );
}
