"use server";

import { createBlinkLightningInvoice, getBlinkInvoiceStatus } from "@/lib/blink/client";
import { isBlinkReceiveConfigured } from "@/lib/blink/env";
import {
  createPendingLightningDonation,
  findDonationByPaymentHash,
  markDonationPaid,
  updateDonationConsent,
} from "@/lib/support/repository";

export type SupportActionResult<T = undefined> =
  { ok: true; data: T } | { ok: false; error: string };

const MIN_SATS = 1;
const MAX_SATS = 2_100_000_000;

export async function createSupportInvoiceAction(amountSats: number): Promise<
  SupportActionResult<{
    donationId: string;
    paymentRequest: string;
    paymentHash: string;
    amountSats: number;
  }>
> {
  if (!isBlinkReceiveConfigured()) {
    return {
      ok: false,
      error:
        "Lightning donations are not configured yet. Try on-chain or silent payments.",
    };
  }

  const amount = Math.floor(Number(amountSats));
  if (!Number.isFinite(amount) || amount < MIN_SATS || amount > MAX_SATS) {
    return { ok: false, error: "Enter a valid amount in sats." };
  }

  try {
    const invoice = await createBlinkLightningInvoice({
      amountSats: amount,
      memo: "Support Pull",
    });
    const row = await createPendingLightningDonation({
      amountSats: invoice.satoshis,
      paymentHash: invoice.paymentHash,
      paymentRequest: invoice.paymentRequest,
    });

    return {
      ok: true,
      data: {
        donationId: row.id,
        paymentRequest: invoice.paymentRequest,
        paymentHash: invoice.paymentHash,
        amountSats: invoice.satoshis,
      },
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not create invoice.",
    };
  }
}

export async function checkSupportInvoiceAction(paymentHash: string): Promise<
  SupportActionResult<{
    donationId: string;
    status: "pending" | "paid" | "expired";
    amountSats: number | null;
  }>
> {
  const hash = paymentHash?.trim();
  if (!hash) {
    return { ok: false, error: "Missing payment hash." };
  }

  try {
    const row = await findDonationByPaymentHash(hash);
    if (!row) {
      return { ok: false, error: "Donation not found." };
    }

    if (row.status === "paid") {
      return {
        ok: true,
        data: {
          donationId: row.id,
          status: "paid",
          amountSats: row.amountSats,
        },
      };
    }

    const status = await getBlinkInvoiceStatus(hash);
    if (status.isPaid) {
      const updated = await markDonationPaid({
        id: row.id,
        amountSats: status.satoshis ?? row.amountSats,
      });
      return {
        ok: true,
        data: {
          donationId: updated?.id ?? row.id,
          status: "paid",
          amountSats: updated?.amountSats ?? row.amountSats,
        },
      };
    }

    if (status.isExpired) {
      return {
        ok: true,
        data: {
          donationId: row.id,
          status: "expired",
          amountSats: row.amountSats,
        },
      };
    }

    return {
      ok: true,
      data: {
        donationId: row.id,
        status: "pending",
        amountSats: row.amountSats,
      },
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not check payment.",
    };
  }
}

export type ConsentChoice = "name_and_amount" | "name_only" | "anonymous";

export async function saveSupportConsentAction(input: {
  donationId: string;
  choice: ConsentChoice;
  displayName?: string;
}): Promise<SupportActionResult<{ donationId: string }>> {
  const donationId = input.donationId?.trim();
  if (!donationId) {
    return { ok: false, error: "Missing donation." };
  }

  const choice = input.choice;
  if (
    choice !== "name_and_amount" &&
    choice !== "name_only" &&
    choice !== "anonymous"
  ) {
    return { ok: false, error: "Invalid preference." };
  }

  const rawName = input.displayName?.trim() ?? "";
  if (choice !== "anonymous") {
    if (rawName.length < 2 || rawName.length > 40) {
      return { ok: false, error: "Display name must be 2–40 characters." };
    }
  }

  try {
    const row = await updateDonationConsent({
      id: donationId,
      displayName: choice === "anonymous" ? null : rawName,
      showPublicly: choice !== "anonymous",
      showAmount: choice === "name_and_amount",
    });
    if (!row) {
      return { ok: false, error: "Donation not found or not paid yet." };
    }
    return { ok: true, data: { donationId: row.id } };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not save preference.",
    };
  }
}
