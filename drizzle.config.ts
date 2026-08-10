import { defineConfig } from "drizzle-kit";

import { loadEnvLocal } from "./lib/db/load-env";

loadEnvLocal();

export default defineConfig({
  dialect: "postgresql",
  schema: "./lib/db/schema/index.ts",
  out: "./drizzle/migrations",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? process.env.NEXT_PUBLIC_DATABASE_URL ?? "",
  },
  strict: true,
  verbose: true,
});
