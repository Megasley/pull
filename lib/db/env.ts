export function getDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL ?? process.env.NEXT_PUBLIC_DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      "Missing DATABASE_URL. Add your Supabase Postgres connection string to .env.local.",
    );
  }

  if (!process.env.DATABASE_URL && process.env.NEXT_PUBLIC_DATABASE_URL) {
    console.warn(
      "Use DATABASE_URL (not NEXT_PUBLIC_DATABASE_URL) - database credentials must not be exposed to the browser.",
    );
  }

  // Prefer Supabase transaction pooler (6543) for Next.js; session mode (5432)
  // is more prone to idle ECONNRESET under hot reload / concurrent RSC queries.
  if (
    process.env.DATABASE_POOL_MODE !== "session" &&
    /pooler\.supabase\.com:5432\b/.test(databaseUrl)
  ) {
    return databaseUrl.replace(
      /pooler\.supabase\.com:5432\b/,
      "pooler.supabase.com:6543",
    );
  }

  return databaseUrl;
}

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL ?? process.env.NEXT_PUBLIC_DATABASE_URL);
}
