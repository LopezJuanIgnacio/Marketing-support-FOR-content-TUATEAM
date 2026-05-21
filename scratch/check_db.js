const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const vp = await prisma.videoProject.findFirst();
  console.log("Storyboard:", vp.storyboard);
}
main().finally(() => prisma.$disconnect());
