import postgres from "postgres";

import { getDatabaseUrl } from "@/lib/db/env";
import { loadEnvLocal } from "@/lib/db/load-env";

loadEnvLocal();

const EXPECTED_TABLES = [
  "users",
  "roadmaps",
  "roadmap_sections",
  "roadmap_nodes",
  "projects",
  "resources",
  "user_progress",
  "user_roadmap_progress",
  "project_submissions",
  "submission_review_events",
  "xp_events",
  "achievements",
  "user_achievements",
  "organizations",
] as const;

const FK_CHECKS = [
  {
    name: "roadmap_sections.roadmap_id -> roadmaps.id",
    query: `
      SELECT 1
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
        AND tc.table_name = 'roadmap_sections'
        AND kcu.column_name = 'roadmap_id'
      LIMIT 1
    `,
  },
  {
    name: "user_progress.user_id -> users.id (cascade)",
    query: `
      SELECT rc.delete_rule
      FROM information_schema.referential_constraints rc
      JOIN information_schema.table_constraints tc
        ON rc.constraint_name = tc.constraint_name
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_schema = 'public'
        AND tc.table_name = 'user_progress'
        AND kcu.column_name = 'user_id'
      LIMIT 1
    `,
    expect: "CASCADE",
  },
] as const;

async function main() {
  const sql = postgres(getDatabaseUrl(), { prepare: false, max: 1 });

  try {
    const tables = await sql<{ table_name: string }[]>`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
    `;

    const tableNames = new Set(tables.map((row) => row.table_name));
    const missingTables = EXPECTED_TABLES.filter((table) => !tableNames.has(table));

    if (missingTables.length > 0) {
      throw new Error(`Missing tables: ${missingTables.join(", ")}`);
    }

    for (const check of FK_CHECKS) {
      const rows = await sql.unsafe(check.query);

      if (rows.length === 0) {
        throw new Error(`Missing foreign key: ${check.name}`);
      }

      if ("expect" in check && rows[0]?.delete_rule !== check.expect) {
        throw new Error(
          `Unexpected delete rule for ${check.name}: ${String(rows[0]?.delete_rule)}`,
        );
      }
    }

    const duplicateRelationships = await sql<{ count: string }[]>`
      SELECT COUNT(*) AS count
      FROM (
        SELECT tc.constraint_name, kcu.table_name, kcu.column_name, ccu.table_name AS foreign_table
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_schema = 'public'
        GROUP BY tc.constraint_name, kcu.table_name, kcu.column_name, ccu.table_name
        HAVING COUNT(*) > 1
      ) duplicates
    `;

    if (Number(duplicateRelationships[0]?.count) > 0) {
      throw new Error("Duplicate foreign key relationships detected.");
    }

    console.log("Schema validation passed.");
    console.log(`Tables: ${EXPECTED_TABLES.length}`);
    console.log(`Foreign keys checked: ${FK_CHECKS.length}`);
  } finally {
    await sql.end({ timeout: 0 });
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
