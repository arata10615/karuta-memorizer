import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.post("/users/device", async (req, res) => {
  try {
    const { deviceId } = req.body as { deviceId: unknown };
    if (!deviceId || typeof deviceId !== "string" || deviceId.length < 8 || deviceId.length > 128) {
      res.status(400).json({ error: "invalid deviceId" });
      return;
    }

    const existing = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.deviceId, deviceId))
      .limit(1);

    if (existing.length > 0) {
      res.json({ user: { id: existing[0].id, deviceId: existing[0].deviceId, displayName: existing[0].displayName } });
      return;
    }

    const inserted = await db
      .insert(usersTable)
      .values({ deviceId })
      .returning({ id: usersTable.id, deviceId: usersTable.deviceId, displayName: usersTable.displayName });

    res.json({ user: inserted[0] });
  } catch (err) {
    console.error("Failed to create/get user:", err);
    res.status(500).json({ error: "internal error" });
  }
});

export default router;
