const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const doc = await prisma.document.findFirst({
    orderBy: { createdAt: 'desc' }
  });
  console.log('Document:', doc);
}

main().catch(console.error).finally(() => prisma.$disconnect());
