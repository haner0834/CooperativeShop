import { PrismaClient } from '@prisma/client';
import path from 'path';

export const prisma = new PrismaClient();

async function main() {
  const schoolsJson = require(
    path.join(process.cwd(), 'shared/jsons/schools.json'),
  );
  const schools: any[] = schoolsJson.map((school: any) => ({
    abbreviation: school.abbreviation,
    emailFormats: school.emailFormat,
    name: school.name,
    studentIdFormat: school.studentIdFormat,
    instagramAccount: school.instagramAccount,
    websiteUrl: school.websiteUrl,
    isLimited: school.isLimited,
  }));

  for (const s of schools) {
    await prisma.school.upsert({
      where: { abbreviation: s.abbreviation },
      update: s,
      create: s,
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
