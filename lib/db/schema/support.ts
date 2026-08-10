import { boolean, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

/**
 * Bitcoin donations received via the public /support page (Blink Lightning,
 * plus recorded metadata for on-chain / silent payment flows).
 */
export const supportDonations = pgTable("support_donations", {
  id: text("id").primaryKey(),
  amountSats: integer("amount_sats"),
  paymentMethod: text("payment_method").notNull(),
  status: text("status").notNull().default("pending"),
  txHash: text("tx_hash"),
  lightningPaymentHash: text("lightning_payment_hash"),
  lightningPaymentRequest: text("lightning_payment_request"),
  displayName: text("display_name"),
  showPublicly: boolean("show_publicly").notNull().default(false),
  showAmount: boolean("show_amount").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
    .notNull()
    .defaultNow(),
  paidAt: timestamp("paid_at", { withTimezone: true, mode: "string" }),
});

export type SupportDonation = typeof supportDonations.$inferSelect;
export type NewSupportDonation = typeof supportDonations.$inferInsert;
