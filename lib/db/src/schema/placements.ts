import { pgTable, serial, integer, timestamp } from "drizzle-orm/pg-core";

export const placementsTable = pgTable("placements", {
  id: serial("id").primaryKey(),
  cardId: integer("card_id").notNull(),
  row: integer("row").notNull(),
  col: integer("col").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Placement = typeof placementsTable.$inferSelect;
