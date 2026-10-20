import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { requireAuth, wrap, type AuthedRequest } from "../auth";

const router = Router();

const reportSchema = z.object({
  targetId: z.string(),
  listingId: z.string().optional(),
  reason: z.string().min(1),
  details: z.string().max(1000).default(""),
});

router.post("/reports", requireAuth, wrap(async (req: AuthedRequest, res) => {
  const b = reportSchema.parse(req.body);
  await prisma.report.create({
    data: { reporterId: req.userId!, targetId: b.targetId, listingId: b.listingId, reason: b.reason, details: b.details },
  });
  res.json({ ok: true });
}));

router.get("/blocks", requireAuth, wrap(async (req: AuthedRequest, res) => {
  const blocks = await prisma.block.findMany({ where: { userId: req.userId }, select: { blockedId: true } });
  res.json({ blockedIds: blocks.map((b) => b.blockedId) });
}));

router.post("/blocks", requireAuth, wrap(async (req: AuthedRequest, res) => {
  const blockedId = z.object({ blockedId: z.string() }).parse(req.body).blockedId;
  await prisma.block.upsert({
    where: { userId_blockedId: { userId: req.userId!, blockedId } },
    create: { userId: req.userId!, blockedId },
    update: {},
  });
  res.json({ ok: true });
}));

router.delete("/blocks/:blockedId", requireAuth, wrap(async (req: AuthedRequest, res) => {
  await prisma.block.deleteMany({ where: { userId: req.userId, blockedId: req.params.blockedId } });
  res.json({ ok: true });
}));

export default router;
