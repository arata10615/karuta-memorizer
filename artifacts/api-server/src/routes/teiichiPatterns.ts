import { Router } from "express";
import { asc, eq } from "drizzle-orm";
import { db, teiichiPatternsTable } from "@workspace/db";

const router = Router();

const MAX_PATTERNS = 10;
const MAX_CARD_ID = 100;
const TEIICHI_ROWS = 3;
const TEIICHI_COLS = 50;

type CardPosition = {
  row: number;
  col: number;
};

type PatternPayload = {
  patternId: string;
  patternName: string;
  isActive: boolean;
  cardPositions: Record<string, CardPosition>;
};

function isValidUserId(value: unknown): value is string {
  return typeof value === "string" && value.length === 36;
}

function validatePattern(p: unknown): p is PatternPayload {
  if (!p || typeof p !== "object") return false;

  const obj = p as Record<string, unknown>;

  if (typeof obj.patternId !== "string" || obj.patternId.length === 0) return false;
  if (typeof obj.patternName !== "string" || obj.patternName.length === 0) return false;
  if (typeof obj.isActive !== "boolean") return false;
  if (!obj.cardPositions || typeof obj.cardPositions !== "object") return false;

  const positions = obj.cardPositions as Record<string, unknown>;

  for (const [key, val] of Object.entries(positions)) {
    const id = Number(key);
    if (!Number.isInteger(id) || id < 1 || id > MAX_CARD_ID) return false;

    if (!val || typeof val !== "object") return false;
    const pos = val as Record<string, unknown>;

    if (typeof pos.row !== "number" || typeof pos.col !== "number") return false;
    if (pos.row < 0 || pos.row >= TEIICHI_ROWS) return false;
    if (pos.col < 0 || pos.col >= TEIICHI_COLS) return false;
  }

  return true;
}

function normalizePatterns(patterns: PatternPayload[]): PatternPayload[] {
  const copied = patterns.map((p) => ({
    ...p,
    cardPositions: { ...p.cardPositions },
  }));

  let activeFound = false;

  for (const p of copied) {
    if (p.isActive && !activeFound) {
      activeFound = true;
    } else {
      p.isActive = false;
    }
  }

  if (!activeFound && copied.length > 0) {
    copied[0].isActive = true;
  }

  return copied;
}

router.get("/teiichi-patterns", async (req, res) => {
  try {
    const userId = req.query.userId;

    if (!isValidUserId(userId)) {
      res.status(400).json({ error: "invalid userId" });
      return;
    }

    const rows = await db
      .select()
      .from(teiichiPatternsTable)
      .where(eq(teiichiPatternsTable.userId, userId))
      .orderBy(asc(teiichiPatternsTable.createdAt));

    res.json({
      patterns: rows.map((row) => ({
        patternId: row.patternId,
        patternName: row.patternName,
        isActive: row.isActive,
        cardPositions: row.cardPositions ?? {},
      })),
    });
  } catch (err) {
    console.error("Failed to load teiichi patterns:", err);
    res.status(500).json({ error: "internal error" });
  }
});

router.put("/teiichi-patterns", async (req, res) => {
  try {
    const { userId, patterns } = req.body as {
      userId?: unknown;
      patterns?: unknown;
    };

    if (!isValidUserId(userId)) {
      res.status(400).json({ error: "invalid userId" });
      return;
    }

    if (!Array.isArray(patterns) || patterns.length > MAX_PATTERNS) {
      res.status(400).json({ error: "invalid patterns" });
      return;
    }

    if (!patterns.every(validatePattern)) {
      res.status(400).json({ error: "invalid pattern shape" });
      return;
    }

    const normalized = normalizePatterns(patterns);

    await db.transaction(async (tx) => {
      await tx
        .delete(teiichiPatternsTable)
        .where(eq(teiichiPatternsTable.userId, userId));

      if (normalized.length > 0) {
        await tx.insert(teiichiPatternsTable).values(
          normalized.map((pattern) => ({
            userId,
            patternId: pattern.patternId,
            patternName: pattern.patternName,
            isActive: pattern.isActive,
            cardPositions: pattern.cardPositions,
          }))
        );
      }
    });

    res.json({ ok: true, count: normalized.length });
  } catch (err) {
    console.error("Failed to save teiichi patterns:", err);
    res.status(500).json({ error: "internal error" });
  }
});

export default router;
