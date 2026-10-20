import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { requireAuth, wrap, type AuthedRequest } from "../auth";
import type { Category } from "@prisma/client";

const router = Router();

router.get("/", requireAuth, wrap(async (req: AuthedRequest, res) => {
  const villagers = await prisma.villager.findMany({ where: { ownerId: req.userId }, orderBy: { createdAt: "asc" } });
  res.json({ villagers });
}));

const addSchema = z.object({
  name: z.string().min(1).max(40),
  category: z.string(),
  note: z.string().max(300).default(""),
  char: z.record(z.number()),
});

// Add an off-app villager — a private visual keepsake for the owner.
router.post("/", requireAuth, wrap(async (req: AuthedRequest, res) => {
  const b = addSchema.parse(req.body);
  const villager = await prisma.villager.create({
    data: {
      ownerId: req.userId!, kind: "OFF", name: b.name,
      category: b.category.toUpperCase() as Category, note: b.note, charLook: b.char,
    },
  });
  res.json({ villager });
}));

export default router;
