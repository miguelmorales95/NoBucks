import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { requireAuth, wrap, type AuthedRequest } from "../auth";

const router = Router();

router.get("/", requireAuth, wrap(async (req: AuthedRequest, res) => {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.userId }, orderBy: { createdAt: "desc" }, take: 50,
  });
  res.json({ notifications });
}));

router.post("/read", requireAuth, wrap(async (req: AuthedRequest, res) => {
  await prisma.notification.updateMany({ where: { userId: req.userId, read: false }, data: { read: true } });
  res.json({ ok: true });
}));

// Register a device for push (Expo token, APNs/FCM token, or Web Push subscription).
router.post("/devices", requireAuth, wrap(async (req: AuthedRequest, res) => {
  const b = z.object({ token: z.string(), platform: z.enum(["ios", "android", "web"]) }).parse(req.body);
  const device = await prisma.device.upsert({
    where: { userId_token: { userId: req.userId!, token: b.token } },
    create: { userId: req.userId!, token: b.token, platform: b.platform },
    update: { platform: b.platform },
  });
  res.json({ device });
}));

export default router;
