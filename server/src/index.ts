import express from "express";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./auth";
import { prisma } from "./lib/prisma";
import { requireAuth } from "./middleware/requireAuth";

const app = express();
const PORT = process.env.PORT ?? 3000;

// Better Auth must come before express.json()
app.all("/api/auth/{*any}", toNodeHandler(auth));

app.use(express.json());

app.get("/api/health", async (_req, res) => {
  await prisma.$queryRaw`SELECT 1`;
  res.json({ status: "ok" });
});

app.get("/api/me", requireAuth, (req, res) => {
  res.json(req.session);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
