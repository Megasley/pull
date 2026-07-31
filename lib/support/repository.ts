import { and, desc, eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { supportDonations } from "@/lib/db/schema";

export type PublicSupporter = {
  id: string;
  displayName: string;
  amountSats: number | null;
  showAmount: boolean;
  paidAt: string;
};

function newId(): string {
  return crypto.randomUUID();
}

export async function createPendingLightningDonation(input: {
  amountSats: number;
  paymentHash: string;
  paymentRequest: string;
}) {
  const db = getDb();
  const id = newId();
  const [row] = await db
    .insert(supportDonations)
    .values({
      id,
      amountSats: input.amountSats,
      paymentMethod: "lightning",
      status: "pending",
      lightningPaymentHash: input.paymentHash,
      lightningPaymentRequest: input.paymentRequest,
    })
    .returning();
  return row;
}

export async function findDonationByPaymentHash(paymentHash: string) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(supportDonations)
    .where(eq(supportDonations.lightningPaymentHash, paymentHash))
    .limit(1);
  return row ?? null;
}

export async function markDonationPaid(input: {
  id: string;
  amountSats?: number | null;
}) {
  const db = getDb();
  const [row] = await db
    .update(supportDonations)
    .set({
      status: "paid",
      paidAt: new Date().toISOString(),
      ...(input.amountSats != null ? { amountSats: input.amountSats } : {}),
    })
    .where(eq(supportDonations.id, input.id))
    .returning();
  return row ?? null;
}

export async function updateDonationConsent(input: {
  id: string;
  displayName: string | null;
  showPublicly: boolean;
  showAmount: boolean;
}) {
  const db = getDb();
  const [row] = await db
    .update(supportDonations)
    .set({
      displayName: input.displayName,
      showPublicly: input.showPublicly,
      showAmount: input.showAmount,
    })
    .where(and(eq(supportDonations.id, input.id), eq(supportDonations.status, "paid")))
    .returning();
  return row ?? null;
}

export async function listPublicSupporters(limit = 24): Promise<PublicSupporter[]> {
  const db = getDb();
  const rows = await db
    .select({
      id: supportDonations.id,
      displayName: supportDonations.displayName,
      amountSats: supportDonations.amountSats,
      showAmount: supportDonations.showAmount,
      paidAt: supportDonations.paidAt,
      createdAt: supportDonations.createdAt,
    })
    .from(supportDonations)
    .where(
      and(
        eq(supportDonations.showPublicly, true),
        eq(supportDonations.status, "paid"),
      ),
    )
    .orderBy(desc(supportDonations.paidAt), desc(supportDonations.createdAt))
    .limit(limit);

  return rows.map((row) => ({
    id: row.id,
    displayName: row.displayName?.trim() || "Anonymous",
    amountSats: row.amountSats,
    showAmount: row.showAmount,
    paidAt: row.paidAt ?? row.createdAt,
  }));
}
