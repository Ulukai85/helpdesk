import { Router } from 'express';
import { z } from 'zod';
import { TicketCategory, TicketStatus } from '@helpdesk/core';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();

const ticketQuerySchema = z.object({
  sortBy: z
    .enum(['subject', 'customerName', 'status', 'category', 'createdAt'])
    .optional()
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  status: z
    .enum([TicketStatus.OPEN, TicketStatus.RESOLVED, TicketStatus.CLOSED])
    .optional(),
  category: z
    .enum([
      TicketCategory.GENERAL_QUESTION,
      TicketCategory.TECHNICAL_QUESTION,
      TicketCategory.REFUND_REQUEST,
      'NONE',
    ])
    .optional(),
  search: z.string().optional(),
});

router.get('/', requireAuth, async (req, res) => {
  const parsed = ticketQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }

  const { sortBy, sortOrder, status, category, search } = parsed.data;

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

  const tickets = await prisma.ticket.findMany({
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
  });

  res.json({ tickets });
});

export default router;
