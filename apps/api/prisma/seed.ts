import { PrismaClient } from "@prisma/client";
import "../src/load-env";
import { seedTaxonomy } from "../src/taxonomy/taxonomy.seed";

async function main() {
  const prisma = new PrismaClient();
  try {
    await seedTaxonomy(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

void main();
