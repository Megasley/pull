CREATE TABLE "support_donations" (
	"id" text PRIMARY KEY NOT NULL,
	"amount_sats" integer,
	"payment_method" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"tx_hash" text,
	"lightning_payment_hash" text,
	"lightning_payment_request" text,
	"display_name" text,
	"show_publicly" boolean DEFAULT false NOT NULL,
	"show_amount" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"paid_at" timestamp with time zone
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "support_donations_ln_hash_uidx"
	ON "support_donations" ("lightning_payment_hash")
	WHERE "lightning_payment_hash" IS NOT NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "support_donations_public_paid_idx"
	ON "support_donations" ("created_at" DESC)
	WHERE "show_publicly" = true AND "status" = 'paid';
