
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const resources = [
    {
      name: "Meeting Room A",
      category: "Meeting Room",
      location: "1st Floor",
      description: "Meeting room for team discussions.",
    },
    {
      name: "Projector 01",
      category: "Equipment",
      location: "IT Department",
      description: "Projector for presentations and meetings.",
    },
    {
      name: "Laptop 01",
      category: "Equipment",
      location: "IT Department",
      description: "Office laptop for temporary use.",
    },
    {
      name: "Conference Room",
      category: "Meeting Room",
      location: "2nd Floor",
      description: "Large room for meetings and presentations.",
    },
  ];

  for (const resource of resources) {
    await prisma.resource.upsert({
      where: { id: resource.name },
      update: {},
      create: resource,
    }).catch(async () => {
      await prisma.resource.create({ data: resource });
    });
  }

  console.log("Sample resources added.");
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
