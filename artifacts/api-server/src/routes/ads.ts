import { Router } from "express";

const router = Router();

router.get("/ads/config", (_req, res) => {
  const pubId = process.env.ADSENSE_PUB_ID || "";
  const sidebarSlot = process.env.ADSENSE_SIDEBAR_SLOT || "";
  const interstitialSlot = process.env.ADSENSE_INTERSTITIAL_SLOT || "";
  res.json({ pubId, sidebarSlot, interstitialSlot });
});

export default router;
