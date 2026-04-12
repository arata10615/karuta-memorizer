import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq, or } from "drizzle-orm";
import { OAuth2Client } from "google-auth-library";

const router = Router();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";

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
      res.json({
        user: {
          id: existing[0].id,
          deviceId: existing[0].deviceId,
          displayName: existing[0].displayName,
          googleId: existing[0].googleId,
        },
      });
      return;
    }

    const inserted = await db
      .insert(usersTable)
      .values({ deviceId })
      .returning();

    res.json({
      user: {
        id: inserted[0].id,
        deviceId: inserted[0].deviceId,
        displayName: inserted[0].displayName,
        googleId: inserted[0].googleId,
      },
    });
  } catch (err) {
    console.error("Failed to create/get user:", err);
    res.status(500).json({ error: "internal error" });
  }
});

router.post("/users/google", async (req, res) => {
  try {
    const { credential, deviceId } = req.body as { credential: string; deviceId?: string };

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
      if (deviceId && user.deviceId !== deviceId) {
        await db
          .update(usersTable)
          .set({ deviceId })
          .where(eq(usersTable.id, user.id));
      }
      if (displayName && user.displayName !== displayName) {
        await db
          .update(usersTable)
          .set({ displayName })
          .where(eq(usersTable.id, user.id));
      }
      res.json({
        user: {
          id: user.id,
          deviceId: deviceId || user.deviceId,
          displayName: displayName || user.displayName,
          googleId,
        },
      });
      return;
    }

    if (deviceId) {
      const existingByDevice = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.deviceId, deviceId))
        .limit(1);

      if (existingByDevice.length > 0) {
        await db
          .update(usersTable)
          .set({ googleId, displayName: displayName || existingByDevice[0].displayName })
          .where(eq(usersTable.id, existingByDevice[0].id));

        res.json({
          user: {
            id: existingByDevice[0].id,
            deviceId: existingByDevice[0].deviceId,
            displayName: displayName || existingByDevice[0].displayName,
            googleId,
          },
        });
        return;
      }
    }

    const newDeviceId = deviceId || crypto.randomUUID();
    const inserted = await db
      .insert(usersTable)
      .values({ deviceId: newDeviceId, googleId, displayName })
      .returning();

    res.json({
      user: {
        id: inserted[0].id,
        deviceId: inserted[0].deviceId,
        displayName: inserted[0].displayName,
        googleId: inserted[0].googleId,
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
