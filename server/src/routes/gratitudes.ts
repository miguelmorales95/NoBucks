import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { requireAuth, wrap, type AuthedRequest } from "../auth";
import type { Category } from "@prisma/client";

const router = Router();

router.get("/", requireAuth, wrap(async (_req, res) => {
  const rows = await prisma.gratitude.findMany({ orderBy: { createdAt: "desc" }, take: 50 });
  const gratitudes = rows.map((g) => ({
    id: g.id, fromName: g.fromName, toName: g.toName, category: g.category, text: g.text,
    when: g.createdAt.toISOString(),
  }));
  res.json({ gratitudes });
}));

// Post a public thank-you (shown in the Gratitudes feed).
router.post("/", requireAuth, wrap(async (req: AuthedRequest, res) => {
  const b = z.object({ toName: z.string().min(1), category: z.string(), text: z.string().min(1).max(500) }).parse(req.body);
  const me = await prisma.user.findUnique({ where: { id: req.userId } });
  const gratitude = await prisma.gratitude.create({
    data: { fromId: req.userId!, fromName: me?.name ?? "A neighbor", toName: b.toName, category: b.category.toUpperCase() as Category, text: b.text },
  });
  res.json({ gratitude });
}));

export default router;
