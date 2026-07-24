import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { getDatabaseUrl } from "./env";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as {
  postgresClient: ReturnType<typeof postgres> | undefined;
  drizzleDb: Database | undefined;
};

function createPostgresClient() {
  return postgres(getDatabaseUrl(), {
    prepare: false,
    // Session/transaction poolers drop idle sockets; keep a small pool and recycle.
    max: 5,
    idle_timeout: 20,
    connect_timeout: 10,
    max_lifetime: 60 * 10,
    connection: {
      application_name: "pull",
    },
  });
}

export function getPostgresClient() {
  if (!globalForDb.postgresClient) {
    globalForDb.postgresClient = createPostgresClient();
  }

  return globalForDb.postgresClient;
}

export type Database = ReturnType<typeof createDb>;

function createDb() {
  return drizzle(getPostgresClient(), { schema });
}

export function getDb() {
  if (!globalForDb.drizzleDb) {
    globalForDb.drizzleDb = createDb();
  }

  return globalForDb.drizzleDb;
}

/** Drop the cached client after a dead connection so the next query reconnects. */
export async function resetDbClient() {
  const client = globalForDb.postgresClient;
  globalForDb.postgresClient = undefined;
  globalForDb.drizzleDb = undefined;

  if (!client) return;

  try {
    await client.end({ timeout: 1 });
  } catch {
    // Already closed / reset.
  }
}

function getErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== "object") return undefined;
  const record = error as {
    code?: string;
    cause?: { code?: string; errno?: number };
    errno?: number;
  };
  return record.code ?? record.cause?.code;
}

export function isDbConnectionError(error: unknown): boolean {
  const code = getErrorCode(error);
  if (
    code === "ECONNRESET" ||
    code === "ECONNREFUSED" ||
    code === "ETIMEDOUT" ||
    code === "ENOTFOUND" ||
    code === "CONNECT_TIMEOUT" ||
    code === "CONNECTION_CLOSED" ||
    code === "57P01" || // admin_shutdown
    code === "57P02" || // crash_shutdown
    code === "57P03" // cannot_connect_now
  ) {
    return true;
  }

  if (error instanceof Error) {
    return /ECONNRESET|ECONNREFUSED|ETIMEDOUT|connection.*(closed|reset|terminated)|Failed query/i.test(
      error.message,
    );
  }

  return false;
}

/** Run a DB operation; on a dead socket, reset the client and retry once. */
export async function withDbRetry<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (!isDbConnectionError(error)) {
      throw error;
    }

    console.warn("[db] connection error, resetting client and retrying once", {
      code: getErrorCode(error),
      message: error instanceof Error ? error.message.slice(0, 200) : String(error),
    });

    await resetDbClient();
    return await operation();
  }
}

export { schema };
