import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { requireAuth, wrap, type AuthedRequest } from "../auth";

const router = Router();

const schema = z.object({
  char: z.record(z.number()).optional(),
  villageTheme: z.string().max(40).optional(),
  wardrobe: z.array(z.string()).optional(),
});

// Update the current user's avatar, village theme, and wardrobe.
router.post("/update", requireAuth, wrap(async (req: AuthedRequest, res) => {
  const b = schema.parse(req.body);
  const user = await prisma.user.update({
    where: { id: req.userId },
    data: {
      ...(b.char ? { charLook: b.char } : {}),
      ...(b.villageTheme ? { villageTheme: b.villageTheme } : {}),
      ...(b.wardrobe ? { wardrobe: b.wardrobe } : {}),
    },
  });
  res.json({ user: { id: user.id, char: user.charLook, villageTheme: user.villageTheme, wardrobe: user.wardrobe } });
}));

export default router;
