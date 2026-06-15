import 'dotenv/config';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { prisma } from '../src/lib/prisma';
import { Role } from '../src/generated/prisma/client';

const email = process.env.ADMIN_EMAIL!;
const password = process.env.ADMIN_PASSWORD!;

if (!email || !password) {
  console.error('ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env');
  process.exit(1);
}

if (password.length < 12) {
  console.error('ADMIN_PASSWORD must be at least 12 characters');
  process.exit(1);
}

const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  emailAndPassword: { enabled: true },
});

async function main() {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Admin user already exists: ${email}`);
    return;
  }

  const result = await auth.api.signUpEmail({
    body: { email, password, name: 'Admin' },
  });

  await prisma.user.update({
    where: { id: result.user.id },
    data: { role: Role.ADMIN },
  });

  console.log(`Admin user created: ${email}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
