import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import { env } from "./env";
import { prisma } from "./db";

export interface AuthedRequest extends Request {
  userId?: string;
}

export function signToken(userId: string, tokenVersion: number): string {
  return jwt.sign({ sub: userId, v: tokenVersion }, env.jwtSecret, { expiresIn: "30d" });
}

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header && header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  let payload: { sub: string; v?: number };
  try {
    payload = jwt.verify(token, env.jwtSecret) as { sub: string; v?: number };
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
  // A token from before a sign-out-everywhere, password change or account deletion is refused.
  prisma.user.findUnique({ where: { id: payload.sub }, select: { tokenVersion: true, deletedAt: true } }).then((u) => {
    if (!u || u.deletedAt || (payload.v ?? 0) !== u.tokenVersion) return res.status(401).json({ error: "Please sign in again" });
    req.userId = payload.sub;
    next();
  }, () => res.status(500).json({ error: "Server error" }));
}

/** Wrap an async handler so rejected promises become 500s instead of crashes. */
export function wrap(
  fn: (req: AuthedRequest, res: Response) => Promise<unknown>
) {
  return (req: AuthedRequest, res: Response) => {
    fn(req, res).catch((err) => {
      console.error(err);
      if (!res.headersSent) res.status(500).json({ error: "Server error" });
    });
  };
}
