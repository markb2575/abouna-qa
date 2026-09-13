import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_SEED_EMAIL;
  const name = process.env.ADMIN_SEED_NAME;

  if (!email || !name) {
    throw new Error("ADMIN_SEED_EMAIL and ADMIN_SEED_NAME must be set to seed the first admin priest");
  }

  const existing = await prisma.priest.findUnique({ where: { email } });
  if (existing) {
    console.log(`Priest ${email} already exists (isAdmin=${existing.isAdmin}); nothing to do.`);
    return;
  }

  const priest = await prisma.priest.create({
    data: { email, name, isAdmin: true },
  });
  console.log(`Created first admin priest: ${priest.email} (${priest.id})`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
