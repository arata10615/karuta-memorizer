import { pgTable, serial, integer, timestamp, text, uuid } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const placementsTable = pgTable("placements", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").references(() => usersTable.id),
  field: text("field").notNull().default("self"),
  cardId: integer("card_id").notNull(),
  row: integer("row").notNull(),
  col: integer("col").notNull(),
  sessionId: text("session_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Placement = typeof placementsTable.$inferSelect;
