import { Router } from "express";
import { createUserSchema } from "@helpdesk/core";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/requireAuth";
import { requireAdmin } from "../middleware/requireAdmin";
import { internalAuth } from "../lib/auth-internal";
import { Role } from "../generated/prisma/client";

const router = Router();

router.get("/", requireAuth, requireAdmin, async (_req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
  res.json({ users });
});

router.post("/", requireAuth, requireAdmin, async (req, res) => {
  const parsed = createUserSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }

  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ error: "A user with this email already exists" });
    return;
  }

  const result = await internalAuth.api.signUpEmail({
    body: { name, email, password, role: Role.AGENT },
  });

  const { id, name: userName, email: userEmail } = result.user;
  res.status(201).json({ user: { id, name: userName, email: userEmail } });
});

export default router;
