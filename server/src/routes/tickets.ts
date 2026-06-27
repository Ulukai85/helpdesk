import { Router } from 'express';
import { ticketQuerySchema } from '@helpdesk/core';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  const parsed = ticketQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }

  const { sortBy, sortOrder, status, category, search, page, pageSize } =
    parsed.data;

  const where = {
    ...(status && { status }),
    ...(category === 'NONE'
      ? { category: null }
      : category
        ? { category }
        : {}),
    ...(search?.trim() && {
      OR: [
        { subject: { contains: search.trim(), mode: 'insensitive' as const } },
        { body: { contains: search.trim(), mode: 'insensitive' as const } },
        { customerName: { contains: search.trim(), mode: 'insensitive' as const } },
        { customerEmail: { contains: search.trim(), mode: 'insensitive' as const } },
      ],
    }),
  };

  const [tickets, total] = await Promise.all([
    prisma.ticket.findMany({
      select: {
        id: true,
        subject: true,
        customerName: true,
        customerEmail: true,
        status: true,
        category: true,
        createdAt: true,
      },
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.ticket.count({ where }),
  ]);

  res.json({ tickets, total });
});

export default router;
