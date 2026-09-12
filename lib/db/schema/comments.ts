import { sql, type SQL } from "drizzle-orm";
import {
  boolean,
  customType,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { commentEntityTypeEnum, commentStatusEnum } from "./enums";
import { projects } from "./roadmaps";
import { users } from "./users";

/**
 * Postgres tsvector, generated + stored from `body` (see the `searchVector`
 * column below). drizzle-orm has no built-in tsvector column type; this is
 * the documented `customType` pattern. The generated migration for this
 * column needs hand review — see drizzle/migrations after running
 * `npm run db:generate` for lib/db/schema/comments.ts.
 */
const tsvector = customType<{ data: string }>({
  dataType() {
    return "tsvector";
  },
});

/**
 * Threaded Q&A attached to a roadmap step, project, or developer tool
 * (issue #25, "Native Developer Collaboration Layer").
 *
 * Threading is intentionally flat: a root question row has `isQuestion: true`
 * and `threadId: null`; every reply has `isQuestion: false` and `threadId`
 * pointing at the root's `id` — never at another reply. That invariant is
 * enforced in lib/comments/repository.ts, not the DB (Postgres self-
 * referential depth constraints aren't worth it here).
 *
 * The entity a comment is attached to uses a discriminator + nullable typed
 * columns rather than a generic entity_id, because only `project` has a real
 * DB row to reference — roadmap steps and developer tools are static content
 * with no backing table. This is the first such exception in this schema;
 * every other cross-table reference here is a direct FK. The
 * `comments_entity_identity_check` CHECK constraint (added by hand to the
 * generated migration, since drizzle can't express it) enforces that exactly
 * the columns matching `entityType` are set.
 */
export const comments = pgTable(
  "comments",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    entityType: commentEntityTypeEnum("entity_type").notNull(),
    projectId: uuid("project_id").references(() => projects.id, {
      onDelete: "cascade",
    }),
    roadmapSlug: text("roadmap_slug"),
    roadmapNodeSlug: text("roadmap_node_slug"),
    developerToolSlug: text("developer_tool_slug"),

    threadId: uuid("thread_id"),
    isQuestion: boolean("is_question").notNull().default(false),

    authorId: uuid("author_id").references(() => users.id, {
      onDelete: "set null",
    }),
    body: text("body").notNull(),

    isAcceptedAnswer: boolean("is_accepted_answer").notNull().default(false),
    acceptedAt: timestamp("accepted_at", { withTimezone: true, mode: "string" }),

    status: commentStatusEnum("status").notNull().default("visible"),
    editedAt: timestamp("edited_at", { withTimezone: true, mode: "string" }),

    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),

    searchVector: tsvector("search_vector").generatedAlwaysAs(
      (): SQL => sql`to_tsvector('english', coalesce(${sql.identifier("body")}, ''))`,
    ),
  },
  (table) => [
    index("comments_thread_id_idx").on(table.threadId),
    index("comments_entity_project_idx").on(table.entityType, table.projectId),
    index("comments_entity_roadmap_idx").on(
      table.roadmapSlug,
      table.roadmapNodeSlug,
    ),
    index("comments_entity_tool_idx").on(table.developerToolSlug),
    index("comments_author_id_idx").on(table.authorId),
    index("comments_created_at_idx").on(table.createdAt),
    uniqueIndex("comments_thread_accepted_idx")
      .on(table.threadId)
      .where(sql`${table.isAcceptedAnswer} = true`),
    index("comments_search_vector_idx").using("gin", table.searchVector),
  ],
);
