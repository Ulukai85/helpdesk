import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";

// This instance is used only for server-side operations (hashing passwords,
// creating users) and never issues cookies or sessions, so BETTER_AUTH_SECRET
// is not required here — the main auth instance in auth.ts handles that.
export const internalAuth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: { enabled: true },
  user: {
    additionalFields: {
      role: { type: "string", required: false, defaultValue: "AGENT" },
    },
  },
});
