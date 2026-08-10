import {
  getBlinkApiKey,
  getBlinkApiUrl,
  getBlinkWalletId,
  isBlinkReceiveConfigured,
} from "@/lib/blink/env";

type GraphQlError = { message?: string };

type LnInvoiceCreateResult = {
  data?: {
    lnInvoiceCreate?: {
      invoice?: {
        paymentRequest: string;
        paymentHash: string;
        satoshis?: number | null;
      } | null;
      errors?: Array<{ message?: string }> | null;
    };
  };
  errors?: GraphQlError[];
};

type InvoiceStatusResult = {
  data?: {
    lnInvoicePaymentStatusByHash?: {
      paymentHash?: string;
      paymentRequest?: string | null;
      status?: string;
    } | null;
  };
  errors?: GraphQlError[];
};

async function blinkGraphql<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const apiKey = getBlinkApiKey();
  if (!apiKey) {
    throw new Error("Blink API key is not configured.");
  }

  const response = await fetch(getBlinkApiUrl(), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "X-API-KEY": apiKey,
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Blink API HTTP ${response.status}`);
  }

  return (await response.json()) as T;
}

export type BlinkInvoice = {
  paymentRequest: string;
  paymentHash: string;
  satoshis: number;
};

export type BlinkInvoiceStatus = {
  paymentHash: string;
  paymentStatus: "PENDING" | "PAID" | "EXPIRED" | string;
  satoshis: number | null;
  isPaid: boolean;
  isExpired: boolean;
  isPending: boolean;
};

/** Create a BTC Lightning invoice (receive-only). Never pays or withdraws. */
export async function createBlinkLightningInvoice(input: {
  amountSats: number;
  memo?: string;
}): Promise<BlinkInvoice> {
  if (!isBlinkReceiveConfigured()) {
    throw new Error("Blink receive is not configured.");
  }

  const walletId = getBlinkWalletId();
  if (!walletId) {
    throw new Error("Blink wallet id is not configured.");
  }

  const amountSats = Math.floor(input.amountSats);
  if (!Number.isFinite(amountSats) || amountSats < 1) {
    throw new Error("Amount must be at least 1 sat.");
  }
  if (amountSats > 21_000_000_00) {
    throw new Error("Amount is too large.");
  }

  const result = await blinkGraphql<LnInvoiceCreateResult>(
    `mutation LnInvoiceCreate($input: LnInvoiceCreateInput!) {
      lnInvoiceCreate(input: $input) {
        invoice {
          paymentRequest
          paymentHash
          satoshis
        }
        errors {
          message
        }
      }
    }`,
    {
      input: {
        walletId,
        amount: amountSats,
        memo: input.memo?.slice(0, 200) || "Support Pull",
      },
    },
  );

  const payload = result.data?.lnInvoiceCreate;
  const apiError = payload?.errors?.[0]?.message || result.errors?.[0]?.message;
  if (apiError) {
    throw new Error(apiError);
  }

  const invoice = payload?.invoice;
  if (!invoice?.paymentRequest || !invoice.paymentHash) {
    throw new Error("Blink did not return an invoice.");
  }

  return {
    paymentRequest: invoice.paymentRequest,
    paymentHash: invoice.paymentHash,
    satoshis: invoice.satoshis ?? amountSats,
  };
}

export async function getBlinkInvoiceStatus(
  paymentHash: string,
): Promise<BlinkInvoiceStatus> {
  if (!getBlinkApiKey()) {
    throw new Error("Blink API key is not configured.");
  }

  const result = await blinkGraphql<InvoiceStatusResult>(
    `query LnInvoicePaymentStatusByHash($input: LnInvoicePaymentStatusByHashInput!) {
      lnInvoicePaymentStatusByHash(input: $input) {
        paymentHash
        paymentRequest
        status
      }
    }`,
    { input: { paymentHash } },
  );

  if (result.errors?.[0]?.message) {
    throw new Error(result.errors[0].message);
  }

  const invoice = result.data?.lnInvoicePaymentStatusByHash;
  if (!invoice?.status) {
    throw new Error("Invoice not found.");
  }

  const paymentStatus = String(invoice.status).toUpperCase();
  return {
    paymentHash: invoice.paymentHash ?? paymentHash,
    paymentStatus,
    satoshis: null,
    isPaid: paymentStatus === "PAID",
    isExpired: paymentStatus === "EXPIRED",
    isPending: paymentStatus === "PENDING",
  };
}
