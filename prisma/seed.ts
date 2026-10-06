import { PrismaClient } from "@prisma/client";
import churchesData from "../src/data/churches.json";

const prisma = new PrismaClient();

type ChurchEntry = { country: string; state: string; church: string };
const churches: ChurchEntry[] = churchesData;

async function main() {
  const email = process.env.ADMIN_SEED_EMAIL;
  const name = process.env.ADMIN_SEED_NAME;
  const churchName = process.env.ADMIN_SEED_CHURCH;

  if (!email || !name || !churchName) {
    throw new Error(
      "ADMIN_SEED_EMAIL, ADMIN_SEED_NAME, and ADMIN_SEED_CHURCH must be set to seed the first admin priest"
    );
  }

  const match = churches.find((c) => c.church === churchName);
  if (!match) {
    throw new Error(
      `ADMIN_SEED_CHURCH "${churchName}" was not found in src/data/churches.json — must match a "church" value exactly.`
    );
  }

  const existing = await prisma.priest.findUnique({ where: { email } });
  if (existing) {
    console.log(`Priest ${email} already exists (isAdmin=${existing.isAdmin}); nothing to do.`);
    return;
  }

  const priest = await prisma.priest.create({
    data: {
      email,
      name,
      isAdmin: true,
      country: match.country,
      state: match.state,
      church: match.church,
    },
  });
  console.log(`Created first admin priest: ${priest.email} (${priest.id}) at ${priest.church}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
