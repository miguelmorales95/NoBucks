import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { requireAuth, wrap, type AuthedRequest } from "../auth";
import type { Category, CostType, ListingType } from "@prisma/client";

const router = Router();

/** Great-circle distance in miles. */
function haversineMiles(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 3958.8;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

function listingDTO(
  l: {
    id: string; type: ListingType; category: Category; title: string; blurb: string;
    costType: CostType; cost: number | null; unit: string; photoUrl: string | null;
    neighborhood: string | null; rating: number; reviews: number;
    author: { id: string; name: string; rating: number; reviews: number };
  },
  dist: number
) {
  const cost =
    l.costType === "SPROUTS" ? l.cost ?? 0 :
    l.costType === "BARTER" ? "barter" :
    l.costType === "PACT" ? "pact" : 0;
  return {
    id: l.id, type: l.type.toLowerCase(), cat: l.category.toLowerCase(),
    name: l.author.name, authorId: l.author.id,
    title: l.title, blurb: l.blurb, cost, unit: l.unit, photo: l.photoUrl ?? undefined,
    neighborhood: l.neighborhood ?? undefined,
    dist: Math.round(dist * 10) / 10, rating: l.rating, reviews: l.reviews,
  };
}

const feedQuery = z.object({
  type: z.enum(["offer", "request", "pact"]).optional(),
  category: z.string().optional(),
  maxDist: z.coerce.number().optional(),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
});

router.get("/", requireAuth, wrap(async (req: AuthedRequest, res) => {
  const q = feedQuery.parse(req.query);
  const me = await prisma.user.findUnique({ where: { id: req.userId } });
  const lat = q.lat ?? me?.lat ?? 0;
  const lng = q.lng ?? me?.lng ?? 0;

  const blocks = await prisma.block.findMany({ where: { userId: req.userId }, select: { blockedId: true } });
  const blockedIds = blocks.map((b) => b.blockedId);

  const listings = await prisma.listing.findMany({
    where: {
      active: true,
      authorId: { notIn: blockedIds.length ? blockedIds : undefined },
      type: q.type ? (q.type.toUpperCase() as ListingType) : undefined,
      category: q.category ? (q.category.toUpperCase() as Category) : undefined,
    },
    include: { author: { select: { id: true, name: true, rating: true, reviews: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const withDist = listings.map((l) => {
    const dist = l.lat != null && l.lng != null ? haversineMiles(lat, lng, l.lat, l.lng) : 0;
    return { l, dist };
  });
  const filtered = q.maxDist != null ? withDist.filter((x) => x.dist <= q.maxDist!) : withDist;
  filtered.sort((a, b) => a.dist - b.dist);
  res.json({ listings: filtered.map((x) => listingDTO(x.l, x.dist)) });
}));

const createSchema = z.object({
  type: z.enum(["offer", "request", "pact"]),
  category: z.string(),
  title: z.string().min(1).max(80),
  blurb: z.string().max(600).default(""),
  costType: z.enum(["SPROUTS", "BARTER", "PACT", "FREE"]).default("SPROUTS"),
  cost: z.number().int().min(0).max(999).nullable().optional(),
  unit: z.string().max(20).default(""),
  photoUrl: z.string().url().optional(),
  neighborhood: z.string().max(60).optional(),
});

router.post("/", requireAuth, wrap(async (req: AuthedRequest, res) => {
  const b = createSchema.parse(req.body);
  const me = await prisma.user.findUnique({ where: { id: req.userId } });
  const listing = await prisma.listing.create({
    data: {
      authorId: req.userId!,
      type: b.type.toUpperCase() as ListingType,
      category: b.category.toUpperCase() as Category,
      title: b.title, blurb: b.blurb || "(No details yet)",
      costType: b.type === "pact" ? "PACT" : b.costType,
      cost: b.costType === "SPROUTS" ? b.cost ?? 0 : null,
      unit: b.unit, photoUrl: b.photoUrl,
      neighborhood: b.neighborhood ?? me?.neighborhood,
      lat: me?.lat, lng: me?.lng,
    },
    include: { author: { select: { id: true, name: true, rating: true, reviews: true } } },
  });
  res.json({ listing: listingDTO(listing, 0) });
}));

router.get("/:id", requireAuth, wrap(async (req, res) => {
  const listing = await prisma.listing.findUnique({
    where: { id: req.params.id },
    include: { author: { select: { id: true, name: true, rating: true, reviews: true } } },
  });
  if (!listing) return res.status(404).json({ error: "Not found" });
  res.json({ listing: listingDTO(listing, 0) });
}));

export default router;
