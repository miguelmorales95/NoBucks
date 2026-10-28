// Appoints (or removes) a community leader for one neighborhood. Run by whoever runs the pilot:
//   npm run make-leader -- someone@example.com "Echo Park"
//   npm run make-leader -- someone@example.com --remove
import { prisma } from "../src/db";

async function main() {
  const [email, hood] = process.argv.slice(2);
  if (!email || !hood) throw new Error('Usage: npm run make-leader -- <email> "<neighborhood>" | --remove');
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.deletedAt) throw new Error(`No account for ${email}`);
  if (hood === "--remove") {
    await prisma.user.update({ where: { id: user.id }, data: { role: "MEMBER" } });
    console.log(`${user.name} is no longer a leader.`);
  } else {
    await prisma.user.update({ where: { id: user.id }, data: { role: "LEADER", neighborhood: hood } });
    console.log(`${user.name} now leads ${hood}.`);
  }
}

main().then(() => prisma.$disconnect(), (e) => { console.error(e.message); process.exit(1); });
