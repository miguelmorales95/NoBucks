import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../db";
import { createHash, randomInt } from "crypto";
import { signToken, requireAuth, wrap, type AuthedRequest } from "../auth";
import { mailConfigured, sendMail } from "../lib/mail";
import { roughCoord } from "../lib/privacy";

const router = Router();

const DEFAULT_LOOK = { species: 0, skin: 1, haircolor: 1, hair: 0, shirt: 1, acc: 0, outfit: 0, hat: 0 };
const DEFAULT_WARDROBE = ["plain", "stripes", "overalls", "hoodie", "dress", "none", "cap", "beanie", "flowercrown"];

export function trustOf(verified: boolean, rating: number): "green" | "yellow" | "red" {
  if (!verified) return "yellow";
  return rating >= 4.8 ? "green" : "yellow";
}

function publicUser(u: {
  id: string; email: string; name: string; balance: number; rating: number;
  reviews: number; verified: boolean; charLook: unknown; neighborhood: string | null; role?: string;
  villageTheme?: string; wardrobe?: unknown;
}) {
  return {
    id: u.id, email: u.email, name: u.name, balance: u.balance, rating: u.rating,
    reviews: u.reviews, verified: u.verified, char: u.charLook, neighborhood: u.neighborhood,
    role: (u.role ?? "MEMBER").toLowerCase(),
    villageTheme: u.villageTheme ?? "neighborhood",
    wardrobe: Array.isArray(u.wardrobe) ? u.wardrobe : [],
    trust: trustOf(u.verified, u.rating),
  };
}

const registerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(40),
  password: z.string().min(8),
  // NoBucks is for adults: people meet strangers to trade help.
  adult: z.literal(true, { errorMap: () => ({ message: "NoBucks is for people 18 and older" }) }),
  char: z.record(z.number()).optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

router.post("/register", wrap(async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Check the form" });
  const body = parsed.data;
  body.email = body.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email: body.email } });
  if (existing) return res.status(409).json({ error: "That email is already registered" });
  const user = await prisma.user.create({
    data: {
      email: body.email,
      name: body.name,
      passwordHash: await bcrypt.hash(body.password, 10),
      charLook: body.char ?? DEFAULT_LOOK,
      wardrobe: DEFAULT_WARDROBE,
      lat: roughCoord(body.lat),
      lng: roughCoord(body.lng),
      adultAt: new Date(),
      transactions: { create: { amount: 12, kind: "GRANT", note: "Welcome grant" } },
    },
  });
  res.json({ token: signToken(user.id, user.tokenVersion), user: publicUser(user) });
}));

const loginSchema = z.object({ email: z.string().email(), password: z.string() });

router.post("/login", wrap(async (req, res) => {
  const body = loginSchema.parse(req.body);
  body.email = body.email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: body.email } });
  if (!user || user.deletedAt || !user.passwordHash || !(await bcrypt.compare(body.password, user.passwordHash))) {
    return res.status(401).json({ error: "Wrong email or password" });
  }
  res.json({ token: signToken(user.id, user.tokenVersion), user: publicUser(user) });
}));

router.get("/me", requireAuth, wrap(async (req: AuthedRequest, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user) return res.status(404).json({ error: "Not found" });
  res.json({ user: publicUser(user) });
}));

// Verification happens in person: a community leader confirms a neighbor (POST
// /admin/members/:id/verify). There is no self-serve check, so "verified" always means a real person
// vouched for them.

// ---- Password reset: a 6-digit code by email, valid 30 minutes, 5 tries ------------------------
const hashCode = (code: string) => createHash("sha256").update(code).digest("hex");

router.post("/forgot", wrap(async (req, res) => {
  const email = z.object({ email: z.string().email() }).parse(req.body).email;
  if (!mailConfigured()) return res.status(501).json({ error: "Password reset isn't set up yet. Ask your community leader for help." });
  const user = await prisma.user.findUnique({ where: { email } });
  // Same answer whether or not the address has an account, so this can't be used to find members.
  // At most 3 codes an hour per account, so guessing stays hopeless (5 tries per code).
  const recent = user ? await prisma.passwordReset.count({ where: { userId: user.id, createdAt: { gt: new Date(Date.now() - 3600_000) } } }) : 0;
  if (user && !user.deletedAt && recent < 3) {
    const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
    await prisma.passwordReset.create({ data: { userId: user.id, codeHash: hashCode(code), expiresAt: new Date(Date.now() + 30 * 60_000) } });
    await sendMail(email, "Your NoBucks reset code", `Your code to reset your NoBucks password is ${code}. It works for 30 minutes.\n\nIf you didn't ask for this, you can ignore this email.`);
  }
  res.json({ ok: true });
}));

router.post("/reset", wrap(async (req, res) => {
  const b = z.object({ email: z.string().email(), code: z.string().regex(/^\d{6}$/), password: z.string().min(8) }).parse(req.body);
  const user = await prisma.user.findUnique({ where: { email: b.email } });
  const reset = user && await prisma.passwordReset.findFirst({
    where: { userId: user.id, usedAt: null, expiresAt: { gt: new Date() } }, orderBy: { createdAt: "desc" },
  });
  if (!user || !reset || reset.attempts >= 5) return res.status(400).json({ error: "That code didn't work. Ask for a new one." });
  if (reset.codeHash !== hashCode(b.code)) {
    await prisma.passwordReset.update({ where: { id: reset.id }, data: { attempts: { increment: 1 } } });
    return res.status(400).json({ error: "That code didn't work. Check it, or ask for a new one." });
  }
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(b.password, 10), tokenVersion: { increment: 1 } }, // signs out other devices
  });
  await prisma.passwordReset.update({ where: { id: reset.id }, data: { usedAt: new Date() } });
  res.json({ token: signToken(updated.id, updated.tokenVersion), user: publicUser(updated) });
}));

// ---- Your account --------------------------------------------------------------------------

// Ends every session on every device (this one included).
router.post("/logout-all", requireAuth, wrap(async (req: AuthedRequest, res) => {
  await prisma.user.update({ where: { id: req.userId }, data: { tokenVersion: { increment: 1 } } });
  res.json({ ok: true });
}));

// Everything NoBucks holds about you, as one JSON file.
router.get("/me/export", requireAuth, wrap(async (req: AuthedRequest, res) => {
  const id = req.userId!;
  const [user, listings, threads, transactions, villagers, notifications, ratingsGiven, ratingsGot, rsvps, events, gratitudes, reports, blocks] = await Promise.all([
    prisma.user.findUnique({ where: { id } }),
    prisma.listing.findMany({ where: { authorId: id } }),
    prisma.thread.findMany({ where: { OR: [{ starterId: id }, { otherId: id }] }, include: { messages: { orderBy: { createdAt: "asc" } }, listing: { select: { title: true } } } }),
    prisma.transaction.findMany({ where: { userId: id }, orderBy: { createdAt: "asc" } }),
    prisma.villager.findMany({ where: { ownerId: id } }),
    prisma.notification.findMany({ where: { userId: id } }),
    prisma.rating.findMany({ where: { raterId: id } }),
    prisma.rating.findMany({ where: { rateeId: id } }),
    prisma.eventRsvp.findMany({ where: { userId: id } }),
    prisma.event.findMany({ where: { hostId: id } }),
    prisma.gratitude.findMany({ where: { fromId: id } }),
    prisma.report.findMany({ where: { reporterId: id } }),
    prisma.block.findMany({ where: { userId: id } }),
  ]);
  if (!user) return res.status(404).json({ error: "Not found" });
  const { passwordHash: _p, tokenVersion: _v, ...profile } = user;
  res.setHeader("content-disposition", `attachment; filename="nobucks-${new Date().toISOString().slice(0, 10)}.json"`);
  res.json({ exportedAt: new Date().toISOString(), profile, listings, threads, transactions, villagers, notifications, ratingsGiven, ratingsGot, rsvps, eventsHosted: events, gratitudes, reportsMade: reports, blocks });
}));

// Deletes the account. Personal details, listings, devices, notifications, blocks, village and
// events go; messages and ratings in other people's trades stay, shown as "Former neighbor", so
// their history still makes sense. Open trades with sprouts held must be finished or cancelled.
router.delete("/me", requireAuth, wrap(async (req: AuthedRequest, res) => {
  const password = z.object({ password: z.string() }).parse(req.body).password;
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user || !user.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ error: "That password isn't right" });
  }
  const open = await prisma.thread.count({ where: { OR: [{ starterId: user.id }, { otherId: user.id }], status: "RESERVED" } });
  if (open) return res.status(409).json({ error: "Finish or cancel your open trades first" });
  const id = user.id;
  await prisma.$transaction([
    prisma.device.deleteMany({ where: { userId: id } }),
    prisma.notification.deleteMany({ where: { userId: id } }),
    prisma.block.deleteMany({ where: { OR: [{ userId: id }, { blockedId: id }] } }),
    prisma.villager.deleteMany({ where: { ownerId: id } }),
    prisma.eventRsvp.deleteMany({ where: { userId: id } }),
    prisma.eventRsvp.deleteMany({ where: { event: { hostId: id } } }),
    prisma.event.deleteMany({ where: { hostId: id } }),
    prisma.passwordReset.deleteMany({ where: { userId: id } }),
    prisma.listing.updateMany({ where: { authorId: id }, data: { active: false, title: "(removed)", blurb: "", photoUrl: null, lat: null, lng: null, locations: undefined } }),
    prisma.gratitude.updateMany({ where: { fromId: id }, data: { fromName: "Former neighbor" } }),
    prisma.user.update({
      where: { id },
      data: {
        email: `deleted-${id}@deleted.invalid`, name: "Former neighbor", passwordHash: null, verified: false, verifyMethod: null,
        lat: null, lng: null, neighborhood: null, wardrobe: [], deletedAt: new Date(), tokenVersion: { increment: 1 },
      },
    }),
  ]);
  res.json({ ok: true });
}));

export default router;
