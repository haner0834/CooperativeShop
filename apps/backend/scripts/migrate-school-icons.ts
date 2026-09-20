import { PrismaClient } from '@prisma/client';
import { env } from '../src/common/utils/env.utils';

const prisma = new PrismaClient();

const schoolIconFileNameMap: Record<string, string> = {
  bmsh: 'bmsh.png',
  ccsh: 'ccsh.png',
  cjshs: 'cjshs.png',
  dwsh: 'dwsh.png',
  hhsh: 'hhsh.png',
  hhvs: 'hhvs.png',
  ctbchs: 'ctbchs.jpg',
  hyivs: 'hyivs.png',
  hysh: 'hysh.png',
  kmsh: 'kmsh.gif',
  lmsh: 'lmsh.png',
  mdsh: 'mdsh.png',
  nkhs: 'nkhs.png',
  nnkieh: 'nnkieh.jpg',
  nnsh: 'nnsh.png',
  pmai: 'pmai.png',
  sfsh: 'sfsh.gif',
  tcjh: 'tcjh.jpeg',
  tncvs: 'tncvs.png',
  tnssh: 'tnssh.png',
  tntcshsa: 'tntcshsa.gif',
  tnvs: 'tnvs.png',
  twais: 'twais.png',
  twvs: 'twvs.png',
  yhsh: 'yhsh.png',
  yrhs: 'yrhs.png',
  shsh: 'shsh.jpg',
};

const R2_PUBLIC_URL = env('R2_PUBLIC_URL');

function getIconUrl(abbr: string): string {
  if (!schoolIconFileNameMap[abbr]) {
    throw new Error(`Failed to map: ${abbr} is not in map.`);
  }
  return R2_PUBLIC_URL + '/' + schoolIconFileNameMap[abbr];
}

async function main() {
  const schools = await prisma.school.findMany();

  for (const school of schools) {
    if (!schoolIconFileNameMap[school.abbreviation]) {
      throw new Error(
        `Missing icon mapping for school: ${school.abbreviation}`,
      );
    }
  }

  for (const school of schools) {
    const iconUrl = getIconUrl(school.abbreviation);

    await prisma.school.update({
      where: { id: school.id },
      data: { iconUrl },
    });
  }

  console.log('Migration completed');
}

main()
  .catch((e) => {
    console.error('Failed to migrate schools:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
