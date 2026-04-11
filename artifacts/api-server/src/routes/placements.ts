import { Router } from "express";
import { db, placementsTable } from "@workspace/db";
import { sql } from "drizzle-orm";

const router = Router();

const MAX_ROWS = 3;
const MAX_COLS = 16;
const MAX_CARD_ID = 100;
const MAX_PLACEMENTS = MAX_ROWS * MAX_COLS;

router.post("/placements", async (req, res) => {
  try {
    const { grid } = req.body as { grid: unknown };
    if (!grid || !Array.isArray(grid) || grid.length > MAX_ROWS) {
      res.status(400).json({ error: "invalid grid" });
      return;
    }

    const rows: { cardId: number; row: number; col: number }[] = [];
    for (let r = 0; r < grid.length; r++) {
      const row = grid[r];
      if (!Array.isArray(row) || row.length > MAX_COLS) {
        res.status(400).json({ error: "invalid grid row" });
        return;
      }
      for (let c = 0; c < row.length; c++) {
        const cardId = row[c];
        if (cardId === null || cardId === undefined) continue;
        if (typeof cardId !== "number" || !Number.isInteger(cardId) || cardId < 1 || cardId > MAX_CARD_ID) {
          res.status(400).json({ error: "invalid card id" });
          return;
        }
        rows.push({ cardId, row: r, col: c });
      }
    }

    if (rows.length > MAX_PLACEMENTS) {
      res.status(400).json({ error: "too many placements" });
      return;
    }

    if (rows.length > 0) {
      await db.insert(placementsTable).values(rows);
    }

    res.json({ ok: true, count: rows.length });
  } catch (err) {
    console.error("Failed to record placements:", err);
    res.status(500).json({ error: "internal error" });
  }
});

router.get("/placements/model", async (_req, res) => {
  try {
    const result = await db
      .select({
        cardId: placementsTable.cardId,
        row: placementsTable.row,
        col: placementsTable.col,
        count: sql<number>`count(*)::int`,
      })
      .from(placementsTable)
      .groupBy(placementsTable.cardId, placementsTable.row, placementsTable.col);

    const model: Record<number, Record<string, number>> = {};
    for (const r of result) {
      if (!model[r.cardId]) model[r.cardId] = {};
      model[r.cardId][`${r.row},${r.col}`] = r.count;
    }

    const totalResult = await db
      .select({ count: sql<number>`count(distinct id)::int` })
      .from(placementsTable);

    res.json({
      model,
      totalRecords: totalResult[0]?.count ?? 0,
    });
  } catch (err) {
    console.error("Failed to get placement model:", err);
    res.status(500).json({ error: "internal error" });
  }
});

export default router;
