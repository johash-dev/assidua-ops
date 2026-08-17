import { PrismaClient } from "@prisma/client";
import "../src/load-env";
import { seedIdentity } from "../src/identity/identity.seed";
import { seedTaxonomy } from "../src/taxonomy/taxonomy.seed";

async function main() {
  const prisma = new PrismaClient();
  try {
    await seedTaxonomy(prisma);
    await seedIdentity(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

void main();
