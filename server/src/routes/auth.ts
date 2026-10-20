import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../db";
import { signToken, requireAuth, wrap, type AuthedRequest } from "../auth";

const router = Router();

const DEFAULT_LOOK = { species: 0, skin: 1, haircolor: 1, hair: 0, shirt: 1, acc: 0 };

function publicUser(u: {
  id: string; email: string; name: string; balance: number; rating: number;
  reviews: number; verified: boolean; charLook: unknown; neighborhood: string | null; role?: string;
}) {
  return {
    id: u.id, email: u.email, name: u.name, balance: u.balance, rating: u.rating,
    reviews: u.reviews, verified: u.verified, char: u.charLook, neighborhood: u.neighborhood,
    role: (u.role ?? "MEMBER").toLowerCase(),
  };
}

const registerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(40),
  password: z.string().min(8),
  char: z.record(z.number()).optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

router.post("/register", wrap(async (req, res) => {
  const body = registerSchema.parse(req.body);
  const existing = await prisma.user.findUnique({ where: { email: body.email } });
  if (existing) return res.status(409).json({ error: "That email is already registered" });
  const user = await prisma.user.create({
    data: {
      email: body.email,
      name: body.name,
      passwordHash: await bcrypt.hash(body.password, 10),
      charLook: body.char ?? DEFAULT_LOOK,
      lat: body.lat,
      lng: body.lng,
      transactions: { create: { amount: 12, kind: "GRANT", note: "Welcome grant" } },
    },
  });
  res.json({ token: signToken(user.id), user: publicUser(user) });
}));

const loginSchema = z.object({ email: z.string().email(), password: z.string() });

router.post("/login", wrap(async (req, res) => {
  const body = loginSchema.parse(req.body);
  const user = await prisma.user.findUnique({ where: { email: body.email } });
  if (!user || !user.passwordHash || !(await bcrypt.compare(body.password, user.passwordHash))) {
    return res.status(401).json({ error: "Wrong email or password" });
  }
  res.json({ token: signToken(user.id), user: publicUser(user) });
}));

router.get("/me", requireAuth, wrap(async (req: AuthedRequest, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user) return res.status(404).json({ error: "Not found" });
  res.json({ user: publicUser(user) });
}));

// Mocked verification step. Swap for Cognito / an ID-verification provider in production.
router.post("/verify", requireAuth, wrap(async (req: AuthedRequest, res) => {
  const method = z.object({ method: z.string() }).parse(req.body).method;
  const user = await prisma.user.update({
    where: { id: req.userId }, data: { verified: true, verifyMethod: method },
  });
  res.json({ user: publicUser(user) });
}));

export default router;
