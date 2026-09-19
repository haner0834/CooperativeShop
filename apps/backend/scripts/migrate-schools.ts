import { PrismaClient } from '@prisma/client';
import path from 'path';

const prisma = new PrismaClient();

const PERIODS = {
  '2025-2026': {
    startAt: new Date('2026-01-01T00:00:00+08:00'),
    endAt: new Date('2026-07-31T23:59:59+08:00'),
  },
  '2026-2027': {
    startAt: new Date('2026-09-01T00:00:00+08:00'),
    endAt: new Date('2027-06-31T23:59:59+08:00'),
  },
} as const;

async function main() {
  const schoolsJson = require(
    path.join(process.cwd(), 'shared/jsons/schools.json'),
  );

  const schools = schoolsJson.map((school: any) => ({
    abbreviation: school.abbreviation,
    emailFormats: school.emailFormat,
    name: school.name,
    studentIdFormat: school.studentIdFormat,
    instagramAccount: school.instagramAccount,
    websiteUrl: school.websiteUrl,
    isLimited: school.isLimited,
  }));

  await prisma.$transaction(async (tx) => {
    /*
     * 1–2. Check if 2025-2026 exists.
     * Create it if it doesn't.
     */
    const period2025 = await tx.partnershipPeriod.upsert({
      where: {
        name: '2025-2026',
      },
      update: {},
      create: {
        name: '2025-2026',
        startAt: PERIODS['2025-2026'].startAt,
        endAt: PERIODS['2025-2026'].endAt,
      },
    });

    /*
     * 3. Add all existing schools into 2025-2026.
     */
    const existingSchools = await tx.school.findMany({
      select: {
        id: true,
      },
    });

    if (existingSchools.length > 0) {
      await tx.partnershipPeriod.update({
        where: {
          id: period2025.id,
        },
        data: {
          schools: {
            connect: existingSchools.map((school) => ({
              id: school.id,
            })),
          },
        },
      });
    }

    /*
     * 4–5. Check if 2026-2027 exists.
     * Create it if it doesn't.
     */
    const period2026 = await tx.partnershipPeriod.upsert({
      where: {
        name: '2026-2027',
      },
      update: {},
      create: {
        name: '2026-2027',
        startAt: PERIODS['2026-2027'].startAt,
        endAt: PERIODS['2026-2027'].endAt,
      },
    });

    /*
     * 6–8. Create missing schools from schools.json
     * and add every school appearing in the JSON
     * into 2026-2027.
     */
    for (const school of schools) {
      const dbSchool = await tx.school.upsert({
        where: {
          abbreviation: school.abbreviation,
        },
        update: school,
        create: school,
      });

      await tx.partnershipPeriod.update({
        where: {
          id: period2026.id,
        },
        data: {
          schools: {
            connect: {
              id: dbSchool.id,
            },
          },
        },
      });
    }
  });

  console.log('Partnership periods migrated successfully.');
}

main()
  .catch((e) => {
    console.error('Failed to migrate schools:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
