import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { getDatabaseUrl } from "./env";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as {
  postgresClient: ReturnType<typeof postgres> | undefined;
  drizzleDb: Database | undefined;
};

function createPostgresClient() {
  const databaseUrl = getDatabaseUrl();
  // Supabase's transaction pooler (pgbouncer) multiplexes many client
  // connections onto few backend ones, so it can support a larger
  // client-side pool. A direct/local connection (e.g. 127.0.0.1:54322 in
  // Docker) has no such multiplexing and idle sockets can be silently
  // dropped by Docker/OS, so keep that path's pool small.
  const isPooled = /pooler\.supabase\.com:6543\b/.test(databaseUrl);

  return postgres(databaseUrl, {
    prepare: false,
    max: isPooled ? 10 : 3,
    // Recycle idle connections quickly so stale sockets don't linger.
    idle_timeout: 10,
    connect_timeout: 10,
    // Rotate connections regularly to avoid silently dead long-lived sockets.
    max_lifetime: 60 * 5,
    // TCP keepalives detect dead connections before a query hits them.
    keep_alive: 10,
    connection: {
      application_name: "pull",
      statement_timeout: 8000,
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
