import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const look = { species: 0, skin: 2, haircolor: 1, hair: 0, shirt: 1, acc: 0 };

async function main() {
  // Echo Park center-ish coordinates for the demo neighborhood.
  const base = { lat: 34.0781, lng: -118.2606, neighborhood: "Echo Park" };

  const maya = await prisma.user.upsert({
    where: { email: "maya@example.com" },
    update: {},
    create: { email: "maya@example.com", name: "Maya", verified: true, charLook: look, ...base },
  });
  const theo = await prisma.user.upsert({
    where: { email: "theo@example.com" },
    update: {},
    create: { email: "theo@example.com", name: "Theo", verified: true, charLook: { ...look, species: 1 }, ...base },
  });

  await prisma.listing.createMany({
    data: [
      { authorId: maya.id, type: "OFFER", category: "FOOD", title: "Fresh sourdough loaf + a jar of starter", blurb: "Baked this morning; I'll teach you to keep the starter alive.", costType: "SPROUTS", cost: 3, unit: "loaf", neighborhood: "Echo Park", lat: base.lat, lng: base.lng },
      { authorId: theo.id, type: "OFFER", category: "REPAIR", title: "Bike tune-up & flat repair", blurb: "Brakes, gears, flats — I bring the tools to your porch.", costType: "SPROUTS", cost: 3, unit: "bike", neighborhood: "Silver Lake", lat: base.lat, lng: base.lng },
    ],
    skipDuplicates: true,
  });

  console.log("Seeded demo neighbors and listings.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
