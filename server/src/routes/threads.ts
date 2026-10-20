import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { requireAuth, wrap, type AuthedRequest } from "../auth";
import { notifyUser } from "../lib/notify";
import type { Category, ThreadRole } from "@prisma/client";

const router = Router();

const first = (n: string) => n.split(/[ &]/)[0];

/** Resolve who pays (client) and who earns (provider) for a thread. */
function sides(role: ThreadRole, starterId: string, otherId: string) {
  if (role === "CLIENT") return { clientId: starterId, providerId: otherId };
  if (role === "PROVIDER") return { clientId: otherId, providerId: starterId };
  return { clientId: null, providerId: null }; // JOINER / pact: no sprouts
}

async function addAppVillager(ownerId: string, person: { id: string; name: string; charLook: unknown }, category: Category, note: string) {
  const existing = await prisma.villager.findFirst({ where: { ownerId, refUserId: person.id } });
  if (existing) return;
  await prisma.villager.create({
    data: { ownerId, kind: "APP", name: person.name, category, note, charLook: person.charLook as object, refUserId: person.id },
  });
}

router.get("/", requireAuth, wrap(async (req: AuthedRequest, res) => {
  const threads = await prisma.thread.findMany({
    where: { OR: [{ starterId: req.userId }, { otherId: req.userId }] },
    include: {
      listing: { select: { title: true, category: true } },
      starter: { select: { id: true, name: true } },
      other: { select: { id: true, name: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { updatedAt: "desc" },
  });
  res.json({ threads });
}));

const startSchema = z.object({
  listingId: z.string(),
  role: z.enum(["client", "provider", "joiner"]),
});

router.post("/", requireAuth, wrap(async (req: AuthedRequest, res) => {
  const b = startSchema.parse(req.body);
  const listing = await prisma.listing.findUnique({ where: { id: b.listingId }, include: { author: true } });
  if (!listing) return res.status(404).json({ error: "Listing not found" });
  if (listing.authorId === req.userId) return res.status(400).json({ error: "That's your own post" });

  const existing = await prisma.thread.findFirst({
    where: { listingId: b.listingId, OR: [{ starterId: req.userId }, { otherId: req.userId }] },
  });
  if (existing) return res.json({ thread: existing, existed: true });

  const role = b.role.toUpperCase() as ThreadRole;
  const me = await prisma.user.findUnique({ where: { id: req.userId } });
  const opener =
    role === "CLIENT" ? `Hi ${first(listing.author.name)}! I'd love to take you up on "${listing.title}". When works?` :
    role === "PROVIDER" ? `Hi ${first(listing.author.name)}! I can help with "${listing.title}". When's good?` :
    `Hi ${first(listing.author.name)}! I'd love to join your pact "${listing.title}".`;

  const thread = await prisma.thread.create({
    data: {
      listingId: listing.id, starterId: req.userId!, otherId: listing.authorId, role, status: "ARRANGING",
      messages: { create: { senderId: req.userId, kind: "USER", text: opener } },
    },
    include: { messages: true },
  });

  if ((role === "PROVIDER" || role === "JOINER") && me) {
    await addAppVillager(req.userId!, listing.author, listing.category, role === "JOINER" ? `Pact: ${listing.title}` : `You helped: ${listing.title}`);
  }
  await notifyUser(listing.authorId, { icon: "💬", title: `New message from ${first(me?.name ?? "a neighbor")}`, body: opener });
  res.json({ thread });
}));

router.get("/:id", requireAuth, wrap(async (req: AuthedRequest, res) => {
  const thread = await prisma.thread.findUnique({
    where: { id: req.params.id },
    include: { listing: true, messages: { orderBy: { createdAt: "asc" } }, starter: { select: { id: true, name: true } }, other: { select: { id: true, name: true } } },
  });
  if (!thread || (thread.starterId !== req.userId && thread.otherId !== req.userId)) return res.status(404).json({ error: "Not found" });
  res.json({ thread });
}));

router.post("/:id/messages", requireAuth, wrap(async (req: AuthedRequest, res) => {
  const text = z.object({ text: z.string().min(1).max(2000) }).parse(req.body).text;
  const thread = await prisma.thread.findUnique({ where: { id: req.params.id } });
  if (!thread || (thread.starterId !== req.userId && thread.otherId !== req.userId)) return res.status(404).json({ error: "Not found" });
  const msg = await prisma.message.create({ data: { threadId: thread.id, senderId: req.userId, kind: "USER", text } });
  await prisma.thread.update({ where: { id: thread.id }, data: { updatedAt: new Date() } });
  const recipientId = thread.starterId === req.userId ? thread.otherId : thread.starterId;
  const me = await prisma.user.findUnique({ where: { id: req.userId } });
  await notifyUser(recipientId, { icon: "💬", title: `New message from ${first(me?.name ?? "a neighbor")}`, body: text });
  res.json({ message: msg });
}));

router.post("/:id/reserve", requireAuth, wrap(async (req: AuthedRequest, res) => {
  const thread = await prisma.thread.findUnique({ where: { id: req.params.id }, include: { listing: { include: { author: true } } } });
  if (!thread || (thread.starterId !== req.userId && thread.otherId !== req.userId)) return res.status(404).json({ error: "Not found" });
  if (thread.status !== "ARRANGING") return res.status(400).json({ error: "Already arranged" });
  const { clientId, providerId } = sides(thread.role, thread.starterId, thread.otherId);
  if (!clientId || !providerId) return res.status(400).json({ error: "Pacts don't use sprouts" });
  if (req.userId !== clientId) return res.status(403).json({ error: "Only the receiver reserves sprouts" });

  const cost = thread.listing.costType === "SPROUTS" ? thread.listing.cost ?? 0 : 0;
  const client = await prisma.user.findUnique({ where: { id: clientId } });
  if (!client || client.balance < cost) return res.status(400).json({ error: "Not enough sprouts" });

  await prisma.$transaction([
    prisma.user.update({ where: { id: clientId }, data: { balance: { decrement: cost } } }),
    prisma.transaction.create({ data: { userId: clientId, amount: -cost, kind: "RESERVE", threadId: thread.id, listingId: thread.listingId, note: `Reserved: ${thread.listing.title}` } }),
    prisma.thread.update({ where: { id: thread.id }, data: { status: "RESERVED", escrow: cost } }),
    prisma.message.create({ data: { threadId: thread.id, kind: "SYSTEM", text: cost > 0 ? `🌱 ${cost} sprouts reserved. Held until you both mark it done.` : "🔁 Barter agreed." } }),
  ]);
  const provider = await prisma.user.findUnique({ where: { id: providerId } });
  if (provider) await addAppVillager(clientId, provider, thread.listing.category, `You got: ${thread.listing.title}`);
  await notifyUser(providerId, { icon: "🌱", title: "A trade is on", body: `${first(client.name)} reserved ${cost} sprouts for "${thread.listing.title}".` });
  res.json({ ok: true });
}));

router.post("/:id/complete", requireAuth, wrap(async (req: AuthedRequest, res) => {
  const thread = await prisma.thread.findUnique({ where: { id: req.params.id }, include: { listing: true } });
  if (!thread || (thread.starterId !== req.userId && thread.otherId !== req.userId)) return res.status(404).json({ error: "Not found" });
  if (thread.status === "DONE") return res.status(400).json({ error: "Already complete" });

  const { clientId, providerId } = sides(thread.role, thread.starterId, thread.otherId);

  if (!clientId || !providerId) {
    // Pact: no sprouts move.
    await prisma.thread.update({ where: { id: thread.id }, data: { status: "DONE" } });
    await prisma.message.create({ data: { threadId: thread.id, kind: "SYSTEM", text: "🤝 Pact confirmed." } });
    return res.json({ ok: true });
  }

  const cost = thread.listing.costType === "SPROUTS" ? thread.listing.cost ?? 0 : 0;
  const ops: any[] = [];

  if (thread.escrow > 0) {
    // Release held escrow to the provider.
    ops.push(prisma.user.update({ where: { id: providerId }, data: { balance: { increment: thread.escrow } } }));
    ops.push(prisma.transaction.create({ data: { userId: providerId, amount: thread.escrow, kind: "RELEASE", threadId: thread.id, listingId: thread.listingId, note: `Earned: ${thread.listing.title}` } }));
  } else if (cost > 0) {
    // No prior reservation — settle now from the client's balance.
    const client = await prisma.user.findUnique({ where: { id: clientId } });
    if (!client || client.balance < cost) return res.status(400).json({ error: "Client has too few sprouts to complete" });
    ops.push(prisma.user.update({ where: { id: clientId }, data: { balance: { decrement: cost } } }));
    ops.push(prisma.transaction.create({ data: { userId: clientId, amount: -cost, kind: "RESERVE", threadId: thread.id, note: `Paid: ${thread.listing.title}` } }));
    ops.push(prisma.user.update({ where: { id: providerId }, data: { balance: { increment: cost } } }));
    ops.push(prisma.transaction.create({ data: { userId: providerId, amount: cost, kind: "EARN", threadId: thread.id, note: `Earned: ${thread.listing.title}` } }));
  }
  ops.push(prisma.thread.update({ where: { id: thread.id }, data: { status: "DONE", escrow: 0 } }));
  ops.push(prisma.message.create({ data: { threadId: thread.id, kind: "SYSTEM", text: "✅ Trade complete. You can now rate each other." } }));
  await prisma.$transaction(ops);

  await notifyUser(providerId, { icon: "🌱", title: "Trade complete", body: `You earned ${cost} sprouts. Rate your neighbor!` });
  await notifyUser(clientId, { icon: "⭐", title: "Trade complete", body: "Rate how it went." });
  res.json({ ok: true });
}));

// Ratings are only possible after a completed trade.
router.post("/:id/rate", requireAuth, wrap(async (req: AuthedRequest, res) => {
  const b = z.object({ stars: z.number().int().min(1).max(5), note: z.string().max(500).default("") }).parse(req.body);
  const thread = await prisma.thread.findUnique({ where: { id: req.params.id } });
  if (!thread || (thread.starterId !== req.userId && thread.otherId !== req.userId)) return res.status(404).json({ error: "Not found" });
  if (thread.status !== "DONE") return res.status(400).json({ error: "You can only rate after a completed trade" });
  const rateeId = thread.starterId === req.userId ? thread.otherId : thread.starterId;

  const existing = await prisma.rating.findUnique({ where: { raterId_threadId: { raterId: req.userId!, threadId: thread.id } } });
  if (existing) return res.status(409).json({ error: "You already rated this trade" });

  await prisma.rating.create({ data: { raterId: req.userId!, rateeId, threadId: thread.id, stars: b.stars, note: b.note } });
  const agg = await prisma.rating.aggregate({ where: { rateeId }, _avg: { stars: true }, _count: true });
  await prisma.user.update({
    where: { id: rateeId },
    data: { rating: Math.round((agg._avg.stars ?? 5) * 10) / 10, reviews: agg._count },
  });
  await notifyUser(rateeId, { icon: "⭐", title: "You got a rating", body: `A neighbor gave you ${b.stars} stars.` });
  res.json({ ok: true });
}));

export default router;
