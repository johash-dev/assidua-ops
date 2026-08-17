import { PrismaClient } from "@prisma/client";

export async function seedTaxonomy(prisma: PrismaClient): Promise<void> {
  const rivon = await dept(prisma, "Rivon");
  const rover = await dept(prisma, "Rover");
  const assidua = await dept(prisma, "Assidua");

  await node(prisma, rivon.id, "Car", true, null);
  await node(prisma, rover.id, "Bike", true, null);

  await node(prisma, assidua.id, "A/C", true, null);
  await node(prisma, assidua.id, "UPS", true, null);
  await node(prisma, assidua.id, "Smart Board", true, null);
  const home = await node(prisma, assidua.id, "Home Appliances", false, null);
  await node(prisma, assidua.id, "Tv", true, home.id);
  await node(prisma, assidua.id, "Washing Machine", true, home.id);
  await node(prisma, assidua.id, "Fridge", true, home.id);
}

async function dept(prisma: PrismaClient, name: string) {
  const existing = await prisma.department.findFirst({ where: { name } });
  if (existing) return existing;
  return prisma.department.create({ data: { name, defaultSlaDays: 10, active: true } });
}

async function node(
  prisma: PrismaClient,
  departmentId: string,
  name: string,
  isLeaf: boolean,
  parentId: string | null,
) {
  const existing = await prisma.categoryNode.findFirst({
    where: { departmentId, name, parentId },
  });
  if (existing) return existing;
  return prisma.categoryNode.create({
    data: { departmentId, name, isLeaf, parentId, active: true },
  });
}
