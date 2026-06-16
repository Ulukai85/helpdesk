import { Router } from "express";
import type { ZodError } from "zod";
import { createUserSchema, editUserSchema } from "@helpdesk/core";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/requireAuth";
import { requireAdmin } from "../middleware/requireAdmin";
import { internalAuth } from "../lib/auth-internal";
import { Role } from "../generated/prisma/client";

const router = Router();

const firstError = (e: ZodError) => e.issues[0].message;

router.get("/", requireAuth, requireAdmin, async (_req, res) => {
  const users = await prisma.user.findMany({
    where: { deletedAt: null },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
  res.json({ users });
});

router.post("/", requireAuth, requireAdmin, async (req, res) => {
  const parsed = createUserSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: firstError(parsed.error) });
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

router.patch("/:id", requireAuth, requireAdmin, async (req, res) => {
  const parsed = editUserSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: firstError(parsed.error) });
    return;
  }

  const id = req.params.id as string;
  const { name, email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const emailTaken = await prisma.user.findFirst({ where: { email, NOT: { id } } });
  if (emailTaken) {
    res.status(409).json({ error: "A user with this email already exists" });
    return;
  }

  await prisma.user.update({ where: { id }, data: { name, email } });

  if (password.trim()) {
    const ctx = await internalAuth.$context;
    const hash = await ctx.password.hash(password.trim());
    await prisma.account.updateMany({
      where: { userId: id, providerId: "credential" },
      data: { password: hash },
    });
  }

  res.json({ user: { id, name, email } });
});

router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = req.params.id as string;

  const user = await prisma.user.findUnique({ where: { id, deletedAt: null } });
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  if (user.role === Role.ADMIN) {
    res.status(403).json({ error: "Admin users cannot be deleted" });
    return;
  }

  await Promise.all([
    prisma.user.update({ where: { id }, data: { deletedAt: new Date() } }),
    prisma.session.deleteMany({ where: { userId: id } }),
  ]);
  res.json({ success: true });
});

export default router;
