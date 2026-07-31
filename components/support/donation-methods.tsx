"use client";

import { useEffect, useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, Zap } from "lucide-react";

import {
  checkSupportInvoiceAction,
  createSupportInvoiceAction,
  type ConsentChoice,
  saveSupportConsentAction,
} from "@/app/actions/support";
import { CopyValueButton } from "@/components/support/copy-button";
import { SupportQrCode } from "@/components/support/qr-code";
import { Button } from "@/components/ui/button";
import { formatSats } from "@/lib/support/format";
import { cn } from "@/lib/utils";

const fieldClassName =
  "mt-1.5 w-full rounded-none border border-border bg-transparent px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

type DonationTab = "lightning" | "onchain" | "silent";

type DonationMethodsProps = {
  lightningEnabled: boolean;
  onchainAddress: string | null;
  silentPaymentAddress: string | null;
};

const PRESETS = [1_000, 5_000, 10_000, 50_000, 100_000] as const;

export function DonationMethods({
  lightningEnabled,
  onchainAddress,
  silentPaymentAddress,
}: DonationMethodsProps) {
  const [tab, setTab] = useState<DonationTab>(
    lightningEnabled ? "lightning" : onchainAddress ? "onchain" : "silent",
  );

  return (
    <section id="donate" className="scroll-mt-24 space-y-6">
      <div>
        <p className="tech-eyebrow">bitcoin // donate</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">
          Donation methods
        </h2>
        <p className="mt-2 max-w-2xl font-mono text-sm text-muted-foreground">
          Support Pull with Lightning for instant settlement, or send on-chain /
          Silent Payments when you prefer base-layer transfers.
        </p>
      </div>

      <div
        role="tablist"
        aria-label="Donation method"
        className="flex flex-wrap gap-2 border-b border-border pb-3"
      >
        {(
          [
            { id: "lightning" as const, label: "Lightning" },
            { id: "onchain" as const, label: "On chain" },
            { id: "silent" as const, label: "Silent Payments" },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            onClick={() => setTab(item.id)}
            className={cn(
              "rounded-none border px-3.5 py-2 font-mono text-[12.5px] font-bold transition-colors",
              tab === item.id
                ? "border-ink bg-ink text-background"
                : "border-ink/25 bg-transparent text-foreground hover:border-ink hover:bg-muted/40",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div role="tabpanel" className="min-h-[280px]">
        {tab === "lightning" ? (
          <LightningPanel enabled={lightningEnabled} />
        ) : null}
        {tab === "onchain" ? (
          onchainAddress ? (
            <AddressPanel
              title="On-chain Bitcoin"
              address={onchainAddress}
              note="On-chain confirmations may take time depending on network fees and mempool conditions."
              qrLabel="Pull Bitcoin address QR code"
            />
          ) : (
            <MethodUnavailable
              title="On-chain address not configured"
              description="Set NEXT_PUBLIC_ONCHAIN_ADDRESS to show Pull’s Bitcoin receive address."
            />
          )
        ) : null}
        {tab === "silent" ? (
          silentPaymentAddress ? (
            <AddressPanel
              title="Silent Payments"
              address={silentPaymentAddress}
              note="Silent Payments improve privacy by allowing supporters to send Bitcoin without reusing addresses."
              qrLabel="Pull Silent Payment address QR code"
            />
          ) : (
            <MethodUnavailable
              title="Silent Payment address not configured"
              description="Set NEXT_PUBLIC_SILENT_PAYMENT_ADDRESS to enable this donation method."
            />
          )
        ) : null}
      </div>
    </section>
  );
}

function MethodUnavailable({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="border border-dashed border-border px-5 py-10 text-center">
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-2 font-mono text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

function AddressPanel({
  title,
  address,
  note,
  qrLabel,
}: {
  title: string;
  address: string;
  note: string;
  qrLabel: string;
}) {
  return (
    <div className="grid gap-8 border border-border bg-background p-5 sm:p-6 md:grid-cols-[auto_1fr] md:items-start">
      <SupportQrCode value={address} label={qrLabel} />
      <div className="min-w-0 space-y-4">
        <div>
          <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
          <p className="mt-2 font-mono text-xs leading-relaxed text-muted-foreground">
            {note}
          </p>
        </div>
        <code className="block break-all border border-border bg-muted/30 px-3 py-2.5 font-mono text-xs leading-relaxed">
          {address}
        </code>
        <CopyValueButton value={address} label="Copy address" />
      </div>
    </div>
  );
}

type InvoiceState = {
  donationId: string;
  paymentRequest: string;
  paymentHash: string;
  amountSats: number;
};

function LightningPanel({ enabled }: { enabled: boolean }) {
  const amountId = useId();
  const [amount, setAmount] = useState("10000");
  const [error, setError] = useState<string | null>(null);
  const [invoice, setInvoice] = useState<InvoiceState | null>(null);
  const [paid, setPaid] = useState(false);
  const [pending, startTransition] = useTransition();
  const [checking, setChecking] = useState(false);
  const [consentOpen, setConsentOpen] = useState(false);

  useEffect(() => {
    if (!invoice || paid) return;

    let cancelled = false;
    let timer: number | undefined;

    async function poll() {
      if (cancelled || !invoice) return;
      setChecking(true);
      try {
        const result = await checkSupportInvoiceAction(invoice.paymentHash);
        if (cancelled) return;
        if (result.ok && result.data.status === "paid") {
          setPaid(true);
          setConsentOpen(true);
          return;
        }
        if (result.ok && result.data.status === "expired") {
          setError("This invoice expired. Generate a new one to continue.");
          setInvoice(null);
          return;
        }
      } finally {
        if (!cancelled) setChecking(false);
      }
      timer = window.setTimeout(() => {
        void poll();
      }, 3000);
    }

    void poll();

    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [invoice, paid]);

  function generateInvoice() {
    setError(null);
    setPaid(false);
    setConsentOpen(false);
    startTransition(async () => {
      const sats = Number(amount);
      const result = await createSupportInvoiceAction(sats);
      if (!result.ok) {
        setError(result.error);
        setInvoice(null);
        return;
      }
      setInvoice(result.data);
    });
  }

  if (!enabled) {
    return (
      <div className="border border-dashed border-border px-5 py-10 text-center">
        <Zap className="mx-auto size-5 text-muted-foreground" aria-hidden />
        <p className="mt-3 text-sm font-medium">Lightning is not configured yet</p>
        <p className="mt-2 font-mono text-xs text-muted-foreground">
          Use on-chain or Silent Payments, or check back once Blink receive is
          enabled.
        </p>
      </div>
    );
  }

  if (paid && invoice) {
    return (
      <>
        <div className="border border-ink/20 bg-signal/10 px-5 py-8 text-center sm:px-8">
          <CheckCircle2 className="mx-auto size-8 text-foreground" aria-hidden />
          <h3 className="mt-4 text-xl font-semibold tracking-tight">
            Payment received
          </h3>
          <p className="mt-2 font-mono text-sm text-muted-foreground">
            Thank you for supporting Pull with {formatSats(invoice.amountSats)}.
          </p>
          <Button
            type="button"
            className="mt-6"
            onClick={() => setConsentOpen(true)}
          >
            Supporters Wall preferences
          </Button>
        </div>
        {consentOpen ? (
          <ConsentModal
            donationId={invoice.donationId}
            onClose={() => setConsentOpen(false)}
          />
        ) : null}
      </>
    );
  }

  return (
    <div className="space-y-6 border border-border p-5 sm:p-6">
      {!invoice ? (
        <>
          <div>
            <label htmlFor={amountId} className="text-sm font-medium">
              Amount (sats)
            </label>
            <input
              id={amountId}
              inputMode="numeric"
              pattern="[0-9]*"
              value={amount}
              onChange={(event) =>
                setAmount(event.target.value.replace(/[^\d]/g, ""))
              }
              disabled={pending}
              className={fieldClassName}
              placeholder="10000"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              {PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAmount(String(preset))}
                  className={cn(
                    "rounded-none border border-ink/25 px-2.5 py-1.5 font-mono text-[11px] font-bold transition-colors hover:border-ink hover:bg-muted/40",
                    amount === String(preset) ? "border-ink bg-muted/50" : null,
                  )}
                >
                  {formatSats(preset)}
                </button>
              ))}
            </div>
          </div>
          {error ? (
            <p className="font-mono text-xs text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          <Button type="button" loading={pending} onClick={generateInvoice}>
            <Zap aria-hidden />
            Generate invoice
          </Button>
        </>
      ) : (
        <div className="grid gap-8 md:grid-cols-[auto_1fr] md:items-start">
          <SupportQrCode
            value={invoice.paymentRequest}
            label="Lightning invoice QR code"
          />
          <div className="min-w-0 space-y-4">
            <div>
              <h3 className="text-lg font-semibold tracking-tight">
                Pay {formatSats(invoice.amountSats)}
              </h3>
              <p className="mt-2 flex items-center gap-2 font-mono text-xs text-muted-foreground">
                {checking || pending ? (
                  <Loader2 className="size-3.5 animate-spin" aria-hidden />
                ) : (
                  <Zap className="size-3.5" aria-hidden />
                )}
                Waiting for Lightning payment…
              </p>
            </div>
            <code className="block max-h-28 overflow-y-auto break-all border border-border bg-muted/30 px-3 py-2.5 font-mono text-[11px] leading-relaxed">
              {invoice.paymentRequest}
            </code>
            <div className="flex flex-wrap gap-2">
              <CopyValueButton
                value={invoice.paymentRequest}
                label="Copy payment request"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setInvoice(null);
                  setError(null);
                }}
              >
                New amount
              </Button>
            </div>
            {error ? (
              <p className="font-mono text-xs text-destructive" role="alert">
                {error}
              </p>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

function ConsentModal({
  donationId,
  onClose,
}: {
  donationId: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const nameId = useId();
  const [choice, setChoice] = useState<ConsentChoice>("name_and_amount");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function submit() {
    setError(null);
    startTransition(async () => {
      const result = await saveSupportConsentAction({
        donationId,
        choice,
        displayName,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSaved(true);
      router.refresh();
      window.setTimeout(onClose, 1200);
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="support-consent-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md border border-ink bg-background p-5 shadow-[var(--shadow-off-sm)] sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        {saved ? (
          <div className="py-6 text-center">
            <CheckCircle2 className="mx-auto size-7" aria-hidden />
            <p className="mt-3 text-sm font-semibold">Preference saved</p>
          </div>
        ) : (
          <>
            <h3
              id="support-consent-title"
              className="text-lg font-semibold tracking-tight"
            >
              Thank you for supporting Pull ❤️
            </h3>
            <p className="mt-2 font-mono text-xs leading-relaxed text-muted-foreground">
              Would you like your donation to appear publicly on the Supporters
              Wall?
            </p>

            <fieldset className="mt-5 space-y-2.5">
              <legend className="sr-only">Visibility preference</legend>
              {(
                [
                  {
                    value: "name_and_amount" as const,
                    label: "Show my name and donation",
                  },
                  { value: "name_only" as const, label: "Show my name only" },
                  { value: "anonymous" as const, label: "Stay anonymous" },
                ] as const
              ).map((option) => (
                <label
                  key={option.value}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 border border-border px-3 py-2.5 text-sm transition-colors",
                    choice === option.value
                      ? "border-ink bg-muted/40"
                      : "hover:bg-muted/20",
                  )}
                >
                  <input
                    type="radio"
                    name="consent"
                    value={option.value}
                    checked={choice === option.value}
                    onChange={() => setChoice(option.value)}
                    className="accent-[var(--ink)]"
                  />
                  {option.label}
                </label>
              ))}
            </fieldset>

            {choice !== "anonymous" ? (
              <div className="mt-4">
                <label htmlFor={nameId} className="text-sm font-medium">
                  Display name
                </label>
                <input
                  id={nameId}
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  maxLength={40}
                  disabled={pending}
                  placeholder="e.g. Kingsley"
                  className={fieldClassName}
                />
              </div>
            ) : null}

            {error ? (
              <p className="mt-3 font-mono text-xs text-destructive" role="alert">
                {error}
              </p>
            ) : null}

            <div className="mt-6 flex flex-wrap gap-2">
              <Button type="button" loading={pending} onClick={submit}>
                Save preference
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={pending}
                onClick={onClose}
              >
                Skip for now
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
