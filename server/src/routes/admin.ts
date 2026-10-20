import { Router, type Response, type NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { requireAuth, wrap, type AuthedRequest } from "../auth";

const router = Router();

async function requireLeader(req: AuthedRequest, res: Response, next: NextFunction) {
  const me = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!me || me.role !== "LEADER") return res.status(403).json({ error: "Community leaders only" });
  next();
}

// Prototype affordance: promote yourself to community leader to explore the tools.
router.post("/claim", requireAuth, wrap(async (req: AuthedRequest, res) => {
  const me = await prisma.user.update({ where: { id: req.userId }, data: { role: "LEADER" } });
  res.json({ role: me.role.toLowerCase() });
}));

router.get("/overview", requireAuth, requireLeader, wrap(async (req: AuthedRequest, res) => {
  const me = await prisma.user.findUnique({ where: { id: req.userId } });
  const hood = me?.neighborhood ?? undefined;
  const [members, listings, events, openReports, pot] = await Promise.all([
    hood ? prisma.user.count({ where: { neighborhood: hood } }) : prisma.user.count(),
    prisma.listing.count({ where: { active: true } }),
    prisma.event.count(),
    prisma.report.count({ where: { status: "OPEN" } }),
    prisma.communityPot.findUnique({ where: { id: "global" } }),
  ]);
  res.json({ neighborhood: hood, members, listings, events, openReports, pot: pot?.balance ?? 0 });
}));

router.get("/reports", requireAuth, requireLeader, wrap(async (_req, res) => {
  const rows = await prisma.report.findMany({
    where: { status: "OPEN" }, orderBy: { createdAt: "desc" }, take: 100,
    include: { reporter: { select: { name: true } }, target: { select: { name: true } } },
  });
  res.json({
    reports: rows.map((r) => ({
      id: r.id, reporterName: r.reporter.name, targetName: r.target.name,
      reason: r.reason, details: r.details, status: r.status.toLowerCase(),
    })),
  });
}));

router.post("/reports/:id/resolve", requireAuth, requireLeader, wrap(async (req, res) => {
  const status = z.object({ status: z.enum(["REVIEWED", "ACTIONED"]) }).parse(req.body).status;
  await prisma.report.update({ where: { id: req.params.id }, data: { status } });
  res.json({ ok: true });
}));

export default router;
