import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { requireAuth, wrap, type AuthedRequest } from "../auth";
import type { Category } from "@prisma/client";

const router = Router();

router.get("/", requireAuth, wrap(async (req: AuthedRequest, res) => {
  const events = await prisma.event.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { _count: { select: { rsvps: true } }, rsvps: { where: { userId: req.userId }, select: { id: true } } },
  });
  res.json({
    events: events.map((e) => ({
      id: e.id, host: e.hostName, category: e.category, neighborhood: e.neighborhood ?? undefined,
      title: e.title, blurb: e.blurb, when: e.whenText, place: e.place, capacity: e.capacity,
      going: e._count.rsvps, rsvped: e.rsvps.length > 0, photo: e.photoUrl ?? undefined,
    })),
  });
}));

const createSchema = z.object({
  title: z.string().min(1).max(80),
  category: z.string(),
  when: z.string().min(1).max(60),
  place: z.string().min(1).max(120),
  capacity: z.number().int().min(2).max(500),
  blurb: z.string().max(600).default(""),
});

router.post("/", requireAuth, wrap(async (req: AuthedRequest, res) => {
  const b = createSchema.parse(req.body);
  const me = await prisma.user.findUnique({ where: { id: req.userId } });
  const ev = await prisma.event.create({
    data: {
      hostId: req.userId!, hostName: me?.name ?? "A neighbor", category: b.category.toUpperCase() as Category,
      neighborhood: me?.neighborhood, title: b.title, blurb: b.blurb, whenText: b.when, place: b.place, capacity: b.capacity,
    },
  });
  await prisma.eventRsvp.create({ data: { eventId: ev.id, userId: req.userId! } }); // host auto-RSVPs
  res.json({ event: { id: ev.id } });
}));

// Toggle the current user's RSVP for an event.
router.post("/:id/rsvp", requireAuth, wrap(async (req: AuthedRequest, res) => {
  const existing = await prisma.eventRsvp.findUnique({ where: { eventId_userId: { eventId: req.params.id, userId: req.userId! } } });
  if (existing) await prisma.eventRsvp.delete({ where: { id: existing.id } });
  else await prisma.eventRsvp.create({ data: { eventId: req.params.id, userId: req.userId! } });
  const going = await prisma.eventRsvp.count({ where: { eventId: req.params.id } });
  res.json({ ok: true, going, rsvped: !existing });
}));

export default router;
