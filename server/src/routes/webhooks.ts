import { Router } from 'express';
import multer from 'multer';
import { sendgridInboundSchema } from '@helpdesk/core';
import { prisma } from '../lib/prisma';
import { requireWebhookToken } from '../middleware/requireWebhookToken';

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
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

router.post('/inbound-email', requireWebhookToken, upload.none(), async (req, res) => {
  const parsed = sendgridInboundSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(200).json({});
    return;
  }

  const { from, subject, text, html } = parsed.data;
  const { name: customerName, email: customerEmail } = parseFrom(from);
  const body = extractBody(text, html);

  const ticket = await prisma.ticket.create({
    data: { subject: subject.trim(), body, customerName, customerEmail },
  });

  res.status(200).json({ id: ticket.id });
});

export default router;
