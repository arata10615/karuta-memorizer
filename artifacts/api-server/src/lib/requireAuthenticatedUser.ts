import type { NextFunction, Request, Response } from "express";
import { getUserIdFromSessionToken } from "./auth";

export function requireAuthenticatedUser(req: Request, res: Response, next: NextFunction): void {
  const authorization = req.header("authorization");
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : null;
  const userId = token ? getUserIdFromSessionToken(token) : null;

  if (!userId) {
    res.status(401).json({ error: "authentication required" });
    return;
  }

  res.locals.userId = userId;
  next();
}
