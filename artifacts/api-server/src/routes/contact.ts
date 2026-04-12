import { Router, type IRouter } from "express";
import { logger } from "../lib/logger";

const router: IRouter = Router();

router.post("/contact", (req, res) => {
  const { name, email, message } = req.body;
  if (!message || !message.trim()) {
    return res.status(400).json({ error: "message is required" });
  }
  logger.info({ name: name || "(未入力)", email: email || "(未入力)", message }, "Contact form submission");
  res.json({ success: true });
});

export default router;
