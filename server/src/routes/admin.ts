import { Router, type Response, type NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { requireAuth, wrap, type AuthedRequest } from "../auth";

// Community-leader tools. Leaders are appointed by whoever runs the pilot (npm run make-leader),
// never by themselves, and only see and act on their own neighborhood.
const router = Router();

interface LeaderRequest extends AuthedRequest { hood?: string }

async function requireLeader(req: LeaderRequest, res: Response, next: NextFunction) {
  const me = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!me || me.role !== "LEADER") return res.status(403).json({ error: "Community leaders only" });
  if (!me.neighborhood) return res.status(403).json({ error: "A leader needs a neighborhood (set it with npm run make-leader)" });
  req.hood = me.neighborhood;
  next();
}

router.use(requireAuth, requireLeader);

router.get("/overview", wrap(async (req: LeaderRequest, res) => {
  const hood = req.hood!;
  const [members, unverified, listings, events, openReports, pot] = await Promise.all([
    prisma.user.count({ where: { neighborhood: hood, deletedAt: null } }),
    prisma.user.count({ where: { neighborhood: hood, deletedAt: null, verified: false } }),
    prisma.listing.count({ where: { active: true, neighborhood: hood } }),
    prisma.event.count({ where: { neighborhood: hood } }),
    prisma.report.count({ where: { status: "OPEN", target: { neighborhood: hood } } }),
    prisma.communityPot.findUnique({ where: { id: "global" } }),
  ]);
  res.json({ neighborhood: hood, members, unverified, listings, events, openReports, pot: pot?.balance ?? 0 });
}));

// Reports about people in this leader's neighborhood only.
router.get("/reports", wrap(async (req: LeaderRequest, res) => {
  const rows = await prisma.report.findMany({
    where: { status: "OPEN", target: { neighborhood: req.hood } }, orderBy: { createdAt: "desc" }, take: 100,
    include: { reporter: { select: { name: true } }, target: { select: { name: true } } },
  });
  res.json({
    reports: rows.map((r) => ({
      id: r.id, reporterName: r.reporter.name, targetName: r.target.name,
      reason: r.reason, details: r.details, status: r.status.toLowerCase(),
    })),
  });
}));

router.post("/reports/:id/resolve", wrap(async (req: LeaderRequest, res) => {
  const status = z.object({ status: z.enum(["REVIEWED", "ACTIONED"]) }).parse(req.body).status;
  const { count } = await prisma.report.updateMany({ where: { id: req.params.id, target: { neighborhood: req.hood } }, data: { status } });
  if (!count) return res.status(404).json({ error: "Not found" });
  res.json({ ok: true });
}));

// Neighbors waiting to be verified, so a leader can confirm them in person (at a meetup, or
// someone they know). Names only: no contact details or locations.
router.get("/members/unverified", wrap(async (req: LeaderRequest, res) => {
  const rows = await prisma.user.findMany({
    where: { neighborhood: req.hood, verified: false, deletedAt: null }, orderBy: { createdAt: "asc" }, take: 200,
    select: { id: true, name: true, createdAt: true },
  });
  res.json({ members: rows });
}));

const verifySchema = z.object({ method: z.enum(["in-person", "known-neighbor", "vouched"]) });

router.post("/members/:id/verify", wrap(async (req: LeaderRequest, res) => {
  const { method } = verifySchema.parse(req.body);
  if (req.params.id === req.userId) return res.status(400).json({ error: "Another leader verifies you" });
  const { count } = await prisma.user.updateMany({
    where: { id: req.params.id, neighborhood: req.hood, deletedAt: null },
    data: { verified: true, verifyMethod: method, verifiedById: req.userId, verifiedAt: new Date() },
  });
  if (!count) return res.status(404).json({ error: "Not found" });
  res.json({ ok: true });
}));

// At a meetup: the neighbor tells the leader the email they signed up with, and the leader
// verifies them, which also brings them into the leader's neighborhood. Someone already in
// another neighborhood stays there (their own leader verifies them).
router.post("/members/verify-by-email", wrap(async (req: LeaderRequest, res) => {
  const { email, method } = verifySchema.extend({ email: z.string().email() }).parse(req.body);
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user || user.deletedAt || (user.neighborhood && user.neighborhood !== req.hood)) return res.status(404).json({ error: "No neighbor with that email here" });
  if (user.id === req.userId) return res.status(400).json({ error: "Another leader verifies you" });
  await prisma.user.update({
    where: { id: user.id },
    data: { neighborhood: req.hood, verified: true, verifyMethod: method, verifiedById: req.userId, verifiedAt: new Date() },
  });
  res.json({ ok: true, name: user.name });
}));

// ---- Join codes: neighbors type one at sign-up (or later) to join this neighborhood ------------
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O or 1/I mix-ups

router.get("/join-codes", wrap(async (req: LeaderRequest, res) => {
  const codes = await prisma.joinCode.findMany({ where: { neighborhood: req.hood, expiresAt: { gt: new Date() } }, orderBy: { createdAt: "desc" } });
  res.json({ codes: codes.map((c) => ({ code: c.code, expiresAt: c.expiresAt, uses: c.uses, maxUses: c.maxUses })) });
}));

router.post("/join-codes", wrap(async (req: LeaderRequest, res) => {
  const { days } = z.object({ days: z.number().int().min(1).max(90).default(30) }).parse(req.body ?? {});
  const { randomInt } = await import("crypto");
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = Array.from({ length: 6 }, () => CODE_CHARS[randomInt(CODE_CHARS.length)]).join("");
    try {
      const c = await prisma.joinCode.create({ data: { code, neighborhood: req.hood!, createdById: req.userId!, expiresAt: new Date(Date.now() + days * 86400_000) } });
      return res.json({ code: c.code, expiresAt: c.expiresAt });
    } catch { /* taken: try another */ }
  }
  res.status(500).json({ error: "Couldn't make a code. Try again." });
}));

router.delete("/join-codes/:code", wrap(async (req: LeaderRequest, res) => {
  await prisma.joinCode.deleteMany({ where: { code: req.params.code.toUpperCase(), neighborhood: req.hood } });
  res.json({ ok: true });
}));

export default router;
