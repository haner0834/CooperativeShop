// scripts/create-admin.ts
//
// 直接操作 DB 建立一筆 Admin + Account（不走 invite 流程），
// 主要拿來 bootstrap 第一個 org admin 用。
//
// 用法：
//   npx ts-node -r dotenv/config scripts/create-admin.ts --email admin@example.com --password "at-least-8-chars"
//
// 可選參數：
//   --name        顯示名稱，預設用 email @ 前半段
//   --level       ORGANIZATION（預設）或 SCHOOL
//   --schoolId    level=SCHOOL 時必填
//
// 注意：
//   1. 這支 script 需要跟後端一樣的 PASSWORD_SERVER_SECRET 環境變數，
//      不然雜湊出來的密碼跟正式 API 用 password.utils.ts 驗證時對不起來。
//      用 `-r dotenv/config` 或先手動 `export` 你的 .env 都可以。
//   2. 密碼會直接出現在 shell 指令跟 shell history 裡，
//      正式環境建議跑完馬上清 history，或改成本 script 底部提到的互動輸入方式。
//   3. 建立完不會立刻反映在 AdminService 的 local cache／Redis 上，
//      要嘛重啟一次後端服務，要嘛之後在程式裡呼叫一次
//      `adminService.invalidateAccount(account.id)`，不然最多要等 60 秒保底輪詢才會生效。

import { PrismaClient, AdminLevel } from '@prisma/client';
import * as crypto from 'crypto';
import * as readline from 'readline';
import { hashPassword } from '../src/common/utils/password.utils';

const prisma = new PrismaClient();

function parseArgs(): Record<string, string> {
  const args = process.argv.slice(2);
  const opts: Record<string, string> = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const value = args[i + 1];
      if (value === undefined || value.startsWith('--')) {
        opts[key] = 'true';
      } else {
        opts[key] = value;
        i++;
      }
    }
  }
  return opts;
}

/** 密碼沒帶在參數裡時，退而求其次用互動輸入（明碼顯示，只是避免留在 shell history 裡） */
function promptPassword(question: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main() {
  const opts = parseArgs();

  const email = opts.email;
  if (!email) {
    console.error(
      'Usage: ts-node scripts/create-admin.ts --email <email> [--password <password>] [--name <name>] [--level ORGANIZATION|SCHOOL] [--schoolId <id>]',
    );
    process.exit(1);
  }

  const password = opts.password ?? (await promptPassword('Password: '));
  if (!password || password.length < 8) {
    console.error('Password must be at least 8 characters.');
    process.exit(1);
  }

  const name = opts.name ?? email.split('@')[0];
  const level: AdminLevel = (opts.level as AdminLevel) ?? 'ORGANIZATION';
  const schoolId = opts.schoolId ?? null;

  if (!['ORGANIZATION', 'SCHOOL'].includes(level)) {
    console.error('--level must be ORGANIZATION or SCHOOL.');
    process.exit(1);
  }

  if (level === 'SCHOOL' && !schoolId) {
    console.error('SCHOOL level admin requires --schoolId.');
    process.exit(1);
  }

  const existingAdmin = await prisma.admin.findUnique({ where: { email } });
  if (existingAdmin) {
    console.error(
      `An admin with email "${email}" already exists (id: ${existingAdmin.id}).`,
    );
    process.exit(1);
  }

  const existingAccount = await prisma.account.findUnique({
    where: {
      provider_providerAccountId: {
        provider: 'credentials',
        providerAccountId: email,
      },
    },
  });
  if (existingAccount) {
    console.error(
      `An account with providerAccountId "${email}" already exists.`,
    );
    process.exit(1);
  }

  // salt 要在 create Admin 之前先產生，因為密碼要用它來 hash
  // (跟 AdminAuthService.acceptInvite 是同一套邏輯)
  const salt = crypto.randomBytes(16).toString('hex');
  const hashedPassword = await hashPassword(password, salt);

  const { admin, account } = await prisma.$transaction(async (tx) => {
    const admin = await tx.admin.create({
      data: {
        name,
        email,
        level,
        schoolId: level === 'SCHOOL' ? schoolId : null,
        salt,
        isActive: true,
      },
    });

    const account = await tx.account.create({
      data: {
        adminId: admin.id,
        role: 'ADMIN',
        provider: 'credentials',
        providerAccountId: email,
        password: hashedPassword,
      },
    });

    return { admin, account };
  });

  console.log('\n✅ Admin created successfully:\n');
  console.log(`  admin.id:   ${admin.id}`);
  console.log(`  account.id: ${account.id}`);
  console.log(`  email:      ${admin.email}`);
  console.log(`  level:      ${admin.level}`);
  console.log(
    '\n⚠️  This will NOT be picked up by AdminService cache immediately.',
  );
  console.log(
    '    Restart the backend, or wait up to 60s for the safety poll,',
  );
  console.log('    before logging in via POST /auth/admin/login.\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
