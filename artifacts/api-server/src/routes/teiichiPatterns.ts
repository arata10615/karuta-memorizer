import { Router } from "express";
import { db, teiichiPatternsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/teiichi-patterns", async (req, res) => {
  try {
    const userId = req.query.userId as string | undefined;
    if (!userId) {
      res.status(400).json({ error: "missing userId" });
      return;
    }

    const rows = await db
      .select()
      .from(teiichiPatternsTable)
      .where(eq(teiichiPatternsTable.userId, userId));

    res.json({
      patterns: rows.map((r: typeof rows[number]) => ({
        patternId: r.patternId,
        patternName: r.patternName,
        isActive: r.isActive,
        cardPositions: r.cardPositions ?? {},
      })),
    });
  } catch (err) {
    console.error("Failed to fetch teiichi patterns:", err);
    res.status(500).json({ error: "internal error" });
  }
});

router.put("/teiichi-patterns", async (req, res) => {
  try {
    const { userId, patterns } = req.body as { userId?: string; patterns?: unknown };
    if (!userId) {
      res.status(400).json({ error: "missing userId" });
      return;
    }
    if (!Array.isArray(patterns)) {
      res.status(400).json({ error: "invalid patterns" });
      return;
    }

    await db.delete(teiichiPatternsTable).where(eq(teiichiPatternsTable.userId, userId));

    if (patterns.length > 0) {
      await db.insert(teiichiPatternsTable).values(
        patterns.map((p) => {
          const row = p as Record<string, unknown>;
          return {
            userId,
            patternId: String(row.patternId || ""),
            patternName: String(row.patternName || ""),
            isActive: Boolean(row.isActive),
            cardPositions: (row.cardPositions as Record<string, { row: number; col: number }>) || {},
          };
        })
      );
    }

    res.json({ ok: true });
  } catch (err) {
    console.error("Failed to save teiichi patterns:", err);
    res.status(500).json({ error: "internal error" });
  }
});

export default router;
