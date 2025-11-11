// seeder.ts (root)
// Run with: npx ts-node -r tsconfig-paths/register seeder.ts
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // 1) Seed Roles (fixed IDs)
  await prisma.role.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, name: 'ADMIN', description: 'Administrators' },
  });
  await prisma.role.upsert({
    where: { id: 2 },
    update: {},
    create: { id: 2, name: 'USER', description: 'Standard users' },
  });

  // 2) Create/Update Admin user
  const email = 'admin@arabsocials.com';
  const plain = 'abc.123';
  const hash = await bcrypt.hash(plain, 10);

  // ---- Variant A: User has a single role via roleId (one-to-many) ----
  // Adjust field names if needed (e.g., passwordHash vs password, name vs fullName)
  const admin = await prisma.user.upsert({
    where: { email },                  // unique on email
    update: {
      password: hash,                  // <-- change to passwordHash if your schema uses that
      roleId: 1,                       // <-- if your User has roleId FK
      // isVerified: true,             // optional
      // status: 'active',             // optional
      // updatedAt auto
    },
    create: {
      email,
      password: hash,                  // <-- change to passwordHash if needed
      name: 'Admin',                   // <-- change to fullName if needed
      roleId: 1,                       // <-- if one-to-many
      // phone: null,
      // isVerified: true,
    },
  });

  // ---- Variant B: If you use many-to-many roles (User.roles) ----
  // Uncomment this block and remove roleId above if your schema has M:N relation:
  /*
  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      password: hash,
      roles: {
        // ensure ADMIN role connected
        connect: [{ id: 1 }],
        // or set: [{ id: 1 }]  // to replace any existing roles
      },
    },
    create: {
      email,
      password: hash,
      name: 'Admin',
      roles: { connect: [{ id: 1 }] },
    },
  });
  */

  // 3) (Optional) Fix sequences if you manually set role IDs
  await prisma.$executeRawUnsafe(`
    SELECT setval(
      pg_get_serial_sequence('app_roles','id'),
      GREATEST((SELECT MAX(id) FROM app_roles), 1)
    );
  `);

  console.log('✅ Seeded roles: ADMIN=1, USER=2');
  console.log(`✅ Admin user: ${admin.email}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
