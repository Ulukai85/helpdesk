import 'dotenv/config';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { prisma } from '../src/lib/prisma';

const EMAIL = 'agent@example.com';
const PASSWORD = 'agentpassword123';

const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  emailAndPassword: { enabled: true },
});

async function main() {
  const existing = await prisma.user.findUnique({ where: { email: EMAIL } });
  if (existing) {
    console.log(`Agent user already exists: ${EMAIL}`);
    return;
  }

  await auth.api.signUpEmail({
    body: { email: EMAIL, password: PASSWORD, name: 'Test Agent' },
  });

  console.log(`Agent user created: ${EMAIL}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
