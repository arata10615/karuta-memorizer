import { Router } from "express";
import { db, teiichiPatternsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuthenticatedUser } from "../lib/requireAuthenticatedUser";

const router = Router();

type CardPosition = { row: number; col: number };
type TeiichiPatternPayload = {
  patternId: string;
  patternName: string;
  isActive: boolean;
  cardPositions: Record<string, CardPosition>;
};

function isPattern(value: unknown): value is TeiichiPatternPayload {
  if (!value || typeof value !== "object") return false;
  const pattern = value as Record<string, unknown>;
  if (
    typeof pattern.patternId !== "string" ||
    pattern.patternId.length === 0 ||
    pattern.patternId.length > 100 ||
    typeof pattern.patternName !== "string" ||
    pattern.patternName.length === 0 ||
    pattern.patternName.length > 100 ||
    typeof pattern.isActive !== "boolean" ||
    !pattern.cardPositions ||
    typeof pattern.cardPositions !== "object"
  ) {
    return false;
  }

  return Object.entries(pattern.cardPositions as Record<string, unknown>).every(([cardId, position]) => {
    if (!/^\d+$/.test(cardId) || !position || typeof position !== "object") return false;
    const { row, col } = position as Record<string, unknown>;
    return (
      typeof row === "number" &&
      typeof col === "number" &&
      Number.isInteger(row) &&
      Number.isInteger(col) &&
      row >= 0 &&
      row < 3 &&
      col >= 0 &&
      col < 50
    );
  });
}

router.use(requireAuthenticatedUser);

router.get("/teiichi-patterns", async (_req, res) => {
  try {
    const userId = res.locals.userId as string;
    const rows = await db
      .select()
      .from(teiichiPatternsTable)
      .where(eq(teiichiPatternsTable.userId, userId));

    res.json({
      patterns: rows.map((row) => ({
        patternId: row.patternId,
        patternName: row.patternName,
        isActive: row.isActive,
        cardPositions: row.cardPositions ?? {},
      })),
    });
  } catch (err) {
    console.error("Failed to fetch teiichi patterns:", err);
    res.status(500).json({ error: "internal error" });
  }
});

router.put("/teiichi-patterns", async (req, res) => {
  try {
    const { patterns } = req.body as { patterns?: unknown };
    if (!Array.isArray(patterns) || patterns.length > 10 || !patterns.every(isPattern)) {
      res.status(400).json({ error: "invalid patterns" });
      return;
    }

    const userId = res.locals.userId as string;
    await db.delete(teiichiPatternsTable).where(eq(teiichiPatternsTable.userId, userId));

    if (patterns.length > 0) {
      await db.insert(teiichiPatternsTable).values(
        patterns.map((pattern) => ({
          userId,
          patternId: pattern.patternId,
          patternName: pattern.patternName,
          isActive: pattern.isActive,
          cardPositions: pattern.cardPositions,
        })),
      );
    }

    res.json({ ok: true });
  } catch (err) {
    console.error("Failed to save teiichi patterns:", err);
    res.status(500).json({ error: "internal error" });
  }
});

export default router;
