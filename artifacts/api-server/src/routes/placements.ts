import { Router } from "express";
import { db, placementsTable } from "@workspace/db";
import { sql, eq, and } from "drizzle-orm";

const router = Router();

const MAX_ROWS = 3;
const MAX_COLS = 16;
const MAX_CARD_ID = 100;
const MAX_PLACEMENTS = MAX_ROWS * MAX_COLS;

function validateGrid(grid: unknown): { cardId: number; row: number; col: number }[] | null {
  if (!grid || !Array.isArray(grid) || grid.length > MAX_ROWS) return null;
  const rows: { cardId: number; row: number; col: number }[] = [];
  for (let r = 0; r < grid.length; r++) {
    const row = grid[r];
    if (!Array.isArray(row) || row.length > MAX_COLS) return null;
    for (let c = 0; c < row.length; c++) {
      const cardId = row[c];
      if (cardId === null || cardId === undefined) continue;
      if (typeof cardId !== "number" || !Number.isInteger(cardId) || cardId < 1 || cardId > MAX_CARD_ID) return null;
      rows.push({ cardId, row: r, col: c });
    }
  }
  if (rows.length > MAX_PLACEMENTS) return null;
  return rows;
}

router.post("/placements", async (req, res) => {
  try {
    const { selfGrid, opGrid, userId } = req.body as {
      selfGrid?: unknown;
      opGrid?: unknown;
      grid?: unknown;
      userId?: string;
    };

    const legacyGrid = req.body.grid;
    const sessionId = crypto.randomUUID();
    let totalCount = 0;

    if (selfGrid) {
      const selfRows = validateGrid(selfGrid);
      if (!selfRows) { res.status(400).json({ error: "invalid selfGrid" }); return; }
      if (selfRows.length > 0) {
        await db.insert(placementsTable).values(
          selfRows.map(r => ({ ...r, userId: userId || null, field: "self", sessionId }))
        );
        totalCount += selfRows.length;
      }
    }

    if (opGrid) {
      const opRows = validateGrid(opGrid);
      if (!opRows) { res.status(400).json({ error: "invalid opGrid" }); return; }
      if (opRows.length > 0) {
        await db.insert(placementsTable).values(
          opRows.map(r => ({ ...r, userId: userId || null, field: "opponent", sessionId }))
        );
        totalCount += opRows.length;
      }
    }

    if (legacyGrid && !selfGrid && !opGrid) {
      const rows = validateGrid(legacyGrid);
      if (!rows) { res.status(400).json({ error: "invalid grid" }); return; }
      if (rows.length > 0) {
        await db.insert(placementsTable).values(
          rows.map(r => ({ ...r, userId: userId || null, field: "self", sessionId }))
        );
        totalCount += rows.length;
      }
    }

    res.json({ ok: true, count: totalCount, sessionId });
  } catch (err) {
    console.error("Failed to record placements:", err);
    res.status(500).json({ error: "internal error" });
  }
});

router.get("/placements/model", async (req, res) => {
  try {
    const userId = req.query.userId as string | undefined;
    const field = (req.query.field as string) || "self";

    const conditions = [eq(placementsTable.field, field)];
    if (userId) {
      conditions.push(eq(placementsTable.userId, userId));
    }

    const result = await db
      .select({
        cardId: placementsTable.cardId,
        row: placementsTable.row,
        col: placementsTable.col,
        count: sql<number>`count(*)::int`,
      })
      .from(placementsTable)
      .where(and(...conditions))
      .groupBy(placementsTable.cardId, placementsTable.row, placementsTable.col);

    const model: Record<number, Record<string, number>> = {};
    for (const r of result) {
      if (!model[r.cardId]) model[r.cardId] = {};
      model[r.cardId][`${r.row},${r.col}`] = r.count;
    }

    const pairResult = await db.execute(sql`
      SELECT a.card_id as card_a, b.card_id as card_b, count(*)::int as cnt
      FROM placements a
      JOIN placements b ON a.session_id = b.session_id
        AND a.field = b.field
        AND a.row = b.row
        AND a.card_id < b.card_id
        AND abs(a.col - b.col) = 1
      WHERE a.field = ${field}
      ${userId ? sql`AND a.user_id = ${userId}` : sql``}
      GROUP BY a.card_id, b.card_id
      HAVING count(*) >= 2
      ORDER BY cnt DESC
      LIMIT 500
    `);

    const pairs: { cardA: number; cardB: number; count: number }[] = [];
    for (const r of pairResult.rows) {
      pairs.push({ cardA: Number(r.card_a), cardB: Number(r.card_b), count: Number(r.cnt) });
    }

    const totalResult = await db
      .select({ count: sql<number>`count(distinct session_id)::int` })
      .from(placementsTable)
      .where(and(...conditions));

    res.json({
      model,
      pairs,
      totalSessions: totalResult[0]?.count ?? 0,
    });
  } catch (err) {
    console.error("Failed to get placement model:", err);
    res.status(500).json({ error: "internal error" });
  }
});

export default router;
