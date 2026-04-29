import {
  pgTable,
  serial,
  uuid,
  text,
  boolean as pgBoolean,
  timestamp,
  jsonb,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export interface DbCardPosition {
  row: number;
  col: number;
}

export const teiichiPatternsTable = pgTable(
  "teiichi_patterns",
  {
    id: serial("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    patternId: text("pattern_id").notNull(),
    patternName: text("pattern_name").notNull(),
    isActive: pgBoolean("is_active").notNull().default(false),
    cardPositions: jsonb("card_positions")
      .$type<Record<string, DbCardPosition>>()
      .notNull()
      .default({}),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    userPatternUnique: uniqueIndex("teiichi_patterns_user_pattern_idx").on(
      table.userId,
      table.patternId
    ),
  })
);

export type TeiichiPatternRow = typeof teiichiPatternsTable.$inferSelect;