// prisma/seed.ts
import { PrismaClient, Status, Role } from '@prisma/client';
import { faker } from '@faker-js/faker';
import { generateRepoName } from 'src/lib/utils';

const prisma = new PrismaClient();

async function main() {}

main()
  .catch((e: unknown) => {
    if (e instanceof Error) {
      console.error('❌ Seeding error:', e.message);
    } else {
      console.error('❌ Seeding error:', e);
    }
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
