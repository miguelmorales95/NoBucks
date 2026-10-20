import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { requireAuth, wrap, type AuthedRequest } from "../auth";

const router = Router();

async function potBalance(): Promise<number> {
  const pot = await prisma.communityPot.upsert({ where: { id: "global" }, create: { id: "global", balance: 0 }, update: {} });
  return pot.balance;
}

router.get("/pot", requireAuth, wrap(async (_req, res) => {
  res.json({ balance: await potBalance() });
}));

// Give sprouts from your balance to the shared community pot (anti-hoarding).
router.post("/gift", requireAuth, wrap(async (req: AuthedRequest, res) => {
  const amount = z.object({ amount: z.number().int().positive().max(999) }).parse(req.body).amount;
  const me = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!me || me.balance < amount) return res.status(400).json({ error: "Not enough sprouts" });
  await prisma.$transaction([
    prisma.user.update({ where: { id: req.userId }, data: { balance: { decrement: amount } } }),
    prisma.transaction.create({ data: { userId: req.userId!, amount: -amount, kind: "GIFT", note: "Gift to community pot" } }),
    prisma.communityPot.upsert({ where: { id: "global" }, create: { id: "global", balance: amount }, update: { balance: { increment: amount } } }),
  ]);
  res.json({ ok: true, balance: await potBalance() });
}));

export default router;
