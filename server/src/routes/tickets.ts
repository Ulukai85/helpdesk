import { Router } from 'express';
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import {
  ticketQuerySchema,
  updateTicketSchema,
  createReplySchema,
  ReplyAuthorType,
  TicketStatus,
  type DashboardStats,
} from '@helpdesk/core';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/requireAuth';
import { sendTicketReplyEmail } from '../lib/sendTicketReplyEmail';

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

  const searchTerm = search?.trim();

  const where = {
    ...(status
      ? { status }
      : { status: { notIn: [TicketStatus.NEW, TicketStatus.PROCESSING] } }),
    ...(category === 'NONE'
      ? { category: null }
      : category
        ? { category }
        : {}),
    ...(searchTerm && {
      OR: [
        { subject: { contains: searchTerm, mode: 'insensitive' as const } },
        { body: { contains: searchTerm, mode: 'insensitive' as const } },
        {
          customerName: { contains: searchTerm, mode: 'insensitive' as const },
        },
        {
          customerEmail: { contains: searchTerm, mode: 'insensitive' as const },
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

router.get('/stats', requireAuth, async (_req, res) => {
  const [{ stats }] = await prisma.$queryRaw<[{ stats: DashboardStats }]>`
    SELECT get_dashboard_stats() AS stats
  `;

  res.json({ stats });
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
      authorType: ReplyAuthorType.AGENT,
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

  await sendTicketReplyEmail({
    ticketId: ticket.id,
    ticketSubject: ticket.subject,
    customerEmail: ticket.customerEmail,
    replyBody: reply.body,
  });

  res.status(201).json({ reply });
});

router.post('/:id/summarize', requireAuth, async (req, res) => {
  const id = parseIntParam(req.params.id);
  if (id === null) {
    res.status(400).json({ error: 'Invalid ticket ID' });
    return;
  }

  const ticket = await prisma.ticket.findUnique({
    where: { id },
    select: { subject: true, body: true, customerName: true },
  });
  if (!ticket) {
    res.status(404).json({ error: 'Ticket not found' });
    return;
  }

  const replies = await prisma.ticketReply.findMany({
    where: { ticketId: id },
    select: {
      body: true,
      authorType: true,
      author: { select: { name: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  const conversationLines = replies.map((r) => {
    const name =
      r.authorType === ReplyAuthorType.CUSTOMER
        ? ticket.customerName
        : (r.author?.name ?? 'Agent');
    return `${name}: ${r.body}`;
  });

  const conversationSection =
    conversationLines.length > 0
      ? `\n\nConversation:\n${conversationLines.join('\n\n')}`
      : '';

  const { text } = await generateText({
    model: openai('gpt-5-nano'),
    prompt: `You are a helpdesk assistant. Summarize the following support ticket and its conversation history in 2–4 concise sentences. Focus on the customer's issue and any resolution or current status.

Subject: ${ticket.subject}
Customer: ${ticket.customerName}
Message: ${ticket.body}${conversationSection}`,
  });

  res.json({ summary: text });
});

router.post('/:id/polish-reply', requireAuth, async (req, res) => {
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

  const ticket = await prisma.ticket.findUnique({
    where: { id },
    select: { subject: true, body: true },
  });
  if (!ticket) {
    res.status(404).json({ error: 'Ticket not found' });
    return;
  }

  const { text } = await generateText({
    model: openai('gpt-5-nano'),
    prompt: `You are a customer support agent. Improve the following draft reply to make it more professional, clear, and helpful. Preserve the original intent and information. Return only the improved reply text with no extra commentary.

Ticket subject: ${ticket.subject}
Customer message: ${ticket.body}

Draft reply:
${parsed.data.body}`,
  });

  res.json({ body: text });
});

export default router;
