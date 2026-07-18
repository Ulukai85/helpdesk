import { Router } from 'express';
import { ticketQuerySchema, updateTicketSchema, createReplySchema } from '@helpdesk/core';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();

function parseIntParam(value: string | string[] | undefined): number | null {
  const n = parseInt(String(value));
  return isNaN(n) ? null : n;
}

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
        {
          customerName: {
            contains: search.trim(),
            mode: 'insensitive' as const,
          },
        },
        {
          customerEmail: {
            contains: search.trim(),
            mode: 'insensitive' as const,
          },
        },
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

router.get('/:id', requireAuth, async (req, res) => {
  const id = parseIntParam(req.params.id);
  if (id === null) {
    res.status(400).json({ error: 'Invalid ticket ID' });
    return;
  }

  const ticket = await prisma.ticket.findUnique({
    where: { id },
    select: {
      id: true,
      subject: true,
      body: true,
      bodyHtml: true,
      customerName: true,
      customerEmail: true,
      status: true,
      category: true,
      assignedTo: { select: { id: true, name: true } },
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!ticket) {
    res.status(404).json({ error: 'Ticket not found' });
    return;
  }

  res.json({ ticket });
});

router.patch('/:id', requireAuth, async (req, res) => {
  const id = parseIntParam(req.params.id);
  if (id === null) {
    res.status(400).json({ error: 'Invalid ticket ID' });
    return;
  }

  const parsed = updateTicketSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }

  const ticket = await prisma.ticket.findUnique({ where: { id } });
  if (!ticket) {
    res.status(404).json({ error: 'Ticket not found' });
    return;
  }

  const { assignedToId, status, category } = parsed.data;

  if (assignedToId !== undefined && assignedToId !== null) {
    const agent = await prisma.user.findUnique({
      where: { id: assignedToId, deletedAt: null },
    });
    if (!agent) {
      res.status(404).json({ error: 'Agent not found' });
      return;
    }
  }

  const updated = await prisma.ticket.update({
    where: { id },
    data: {
      ...(assignedToId !== undefined && { assignedToId }),
      ...(status !== undefined && { status }),
      ...(category !== undefined && { category }),
    },
    select: {
      id: true,
      status: true,
      category: true,
      assignedTo: { select: { id: true, name: true } },
    },
  });

  res.json({ ticket: updated });
});

router.get('/:id/replies', requireAuth, async (req, res) => {
  const id = parseIntParam(req.params.id);
  if (id === null) {
    res.status(400).json({ error: 'Invalid ticket ID' });
    return;
  }

  const ticket = await prisma.ticket.findUnique({ where: { id } });
  if (!ticket) {
    res.status(404).json({ error: 'Ticket not found' });
    return;
  }

  const replies = await prisma.ticketReply.findMany({
    where: { ticketId: id },
    select: {
      id: true,
      body: true,
      authorType: true,
      author: { select: { id: true, name: true } },
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  res.json({ replies });
});

router.post('/:id/replies', requireAuth, async (req, res) => {
  const id = parseIntParam(req.params.id);
  if (id === null) {
    res.status(400).json({ error: 'Invalid ticket ID' });
    return;
  }

  const parsed = createReplySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }

  const ticket = await prisma.ticket.findUnique({ where: { id } });
  if (!ticket) {
    res.status(404).json({ error: 'Ticket not found' });
    return;
  }

  const reply = await prisma.ticketReply.create({
    data: {
      ticketId: id,
      authorType: 'AGENT',
      authorId: req.session!.user.id,
      body: parsed.data.body,
    },
    select: {
      id: true,
      body: true,
      authorType: true,
      author: { select: { id: true, name: true } },
      createdAt: true,
    },
  });

  res.status(201).json({ reply });
});

export default router;
