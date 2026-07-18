import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { OAuth2Client } from "google-auth-library";
import { createSessionToken } from "../lib/auth";

const router = Router();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";

router.post("/users/google", async (req, res) => {
  try {
    const { credential } = req.body as { credential: string };

    if (!credential || typeof credential !== "string") {
      res.status(400).json({ error: "missing credential" });
      return;
    }

    if (!GOOGLE_CLIENT_ID) {
      res.status(500).json({ error: "Google login not configured" });
      return;
    }

    const client = new OAuth2Client(GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload || !payload.sub) {
      res.status(400).json({ error: "invalid token" });
      return;
    }

    const googleId = payload.sub;
    const displayName = payload.name || payload.email || null;

    const existingByGoogle = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.googleId, googleId))
      .limit(1);

    if (existingByGoogle.length > 0) {
      const user = existingByGoogle[0];
      if (displayName && user.displayName !== displayName) {
        await db
          .update(usersTable)
          .set({ displayName })
          .where(eq(usersTable.id, user.id));
      }

      res.json({
        user: {
          id: user.id,
          displayName: displayName || user.displayName,
          googleId,
          sessionToken: createSessionToken(user.id),
        },
      });
      return;
    }

    // NOTE: device login is廃止済み. schema互換のため device_id は固定形式で保持する。
    const inserted = await db
      .insert(usersTable)
      .values({ deviceId: `google:${googleId}`, googleId, displayName })
      .returning();

    res.json({
      user: {
        id: inserted[0].id,
        displayName: inserted[0].displayName,
        googleId: inserted[0].googleId,
        sessionToken: createSessionToken(inserted[0].id),
      },
    });
  } catch (err) {
    console.error("Failed to Google login:", err);
    res.status(500).json({ error: "internal error" });
  }
});

router.get("/users/google-client-id", (_req, res) => {
  res.json({ clientId: GOOGLE_CLIENT_ID || null });
});

export default router;
