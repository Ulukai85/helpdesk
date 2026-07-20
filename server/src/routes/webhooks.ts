import { Router } from 'express';
import multer from 'multer';
import Parse from '@sendgrid/inbound-mail-parser';
import { sendgridInboundSchema, ReplyAuthorType } from '@helpdesk/core';
import { prisma } from '../lib/prisma';
import { requireWebhookToken } from '../middleware/requireWebhookToken';
import { classifyTicket } from '../lib/classifyTicket';
import { resolveTicket } from '../lib/resolveTicket';

const router = Router();

// text fields only — reject file uploads
const upload = multer({ limits: { fileSize: 0, fieldSize: 1024 * 1024 } });

function parseFrom(from: string): { name: string; email: string } {
  const match = /^(.+?)\s*<([^>]+)>$/.exec(from.trim());
  if (match) return { name: match[1].trim(), email: match[2].trim() };
  const email = from.trim();
  return { name: email.split('@')[0], email };
}

function extractBody(text: string, html: string): string {
  if (text.trim()) return text.trim();
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractTicketId(subject: string): number | null {
  const match = /#(\d+)/.exec(subject);
  return match ? parseInt(match[1]) : null;
}

router.post(
  '/inbound-email',
  requireWebhookToken,
  upload.none(),
  async (req, res) => {
    const parser = new Parse(
      { keys: ['from', 'subject', 'text', 'html'] },
      { body: req.body },
    );
    // keyValues() reduces over the matched keys with no initial value, so it
    // throws when none of the configured keys are present in the payload.
    let payload: Record<string, unknown>;
    try {
      payload = parser.keyValues();
    } catch {
      payload = {};
    }
    const parsed = sendgridInboundSchema.safeParse(payload);
    if (!parsed.success) {
      res.status(200).json({});
      return;
    }

    const { from, subject, text, html } = parsed.data;
    const { name: customerName, email: customerEmail } = parseFrom(from);
    const body = extractBody(text, html);

    const ticketId = extractTicketId(subject);
    if (ticketId !== null) {
      const existing = await prisma.ticket.findFirst({
        where: { id: ticketId, customerEmail },
      });
      if (existing) {
        await prisma.ticketReply.create({
          data: { ticketId: existing.id, authorType: ReplyAuthorType.CUSTOMER, body },
        });
        res.status(200).json({ id: existing.id });
        return;
      }
    }

    const ticket = await prisma.ticket.create({
      data: { subject: subject.trim(), body, customerName, customerEmail },
    });

    await classifyTicket(ticket);
    await resolveTicket(ticket);

    res.status(200).json({ id: ticket.id });
  },
);

export default router;
