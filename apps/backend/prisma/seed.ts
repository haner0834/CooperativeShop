import { PrismaClient } from "@prisma/client";
import { School } from "@prisma/client";

export const prisma = new PrismaClient();

async function main() {
  const schoolsJson = require("../../../shared/jsons/schools.json");
  const schools: any[] = schoolsJson.map((school: any) => ({
    abbreviation: school.abbreviation,
    emailFormats: [school.emailFormat],
    name: school.name,
    studentIdFormat: school.studentIdFormat,
  }));

  for (const s of schools) {
    await prisma.school.upsert({
      where: { abbreviation: s.abbreviation },
      update: {},
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
