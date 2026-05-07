import { pgTable, uuid, text, boolean, jsonb, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const teiichiPatternsTable = pgTable(
  "teiichi_patterns",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull(),
    patternId: text("pattern_id").notNull(),
    patternName: text("pattern_name").notNull(),
    isActive: boolean("is_active").notNull().default(false),
    cardPositions: jsonb("card_positions").$type<Record<string, { row: number; col: number }>>().notNull().default({}),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userPatternUnique: uniqueIndex("teiichi_patterns_user_pattern_unique").on(table.userId, table.patternId),
  })
);
