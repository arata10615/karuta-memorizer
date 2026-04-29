import { Router } from "express";
import { logger } from "../lib/logger";

const router = Router();

router.post("/contact", (req, res): void => {
  const { name, email, message } = req.body ?? {};

  if (!message || !String(message).trim()) {
    res.status(400).json({ error: "message is required" });
    return;
  }

  logger.info(
    {
      name: name || "(未入力)",
      email: email || "(未入力)",
      message,
    },
    "Contact form submission"
  );

  res.json({ success: true });
  return;
});

export default router;