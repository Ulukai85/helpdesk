import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PgBoss } from 'pg-boss';
import * as Sentry from '@sentry/node';
import { generateText, Output } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { TicketStatus, ReplyAuthorType } from '@helpdesk/core';
import { prisma } from './prisma';
import { sendTicketReplyEmail } from './sendTicketReplyEmail';

const RESOLVE_TICKET_QUEUE = 'resolve-ticket';

const KNOWLEDGE_BASE = readFileSync(
  join(import.meta.dirname, '../../knowledge-base.md'),
  'utf-8',
);

const resolutionSchema = z.object({
  canResolve: z.boolean(),
  reply: z.string(),
});

type Ticket = {
  id: number;
  subject: string;
  body: string;
  customerName: string;
  customerEmail: string;
};

export const boss = new PgBoss({ connectionString: process.env.DATABASE_URL });
boss.on('error', (err) => {
  console.error(err);
  Sentry.captureException(err);
});

export async function startResolveTicketWorker(): Promise<void> {
  if (!process.env.OPENAI_API_KEY) return;

  await boss.start();
  await boss.createQueue(RESOLVE_TICKET_QUEUE, {
    retryLimit: 2,
    retryBackoff: true,
  });

  await boss.work<Ticket>(RESOLVE_TICKET_QUEUE, async ([job]) => {
    const { id, subject, body, customerName, customerEmail } = job.data;

    await prisma.ticket.update({
      where: { id },
      data: { status: TicketStatus.PROCESSING },
    });

    try {
      const firstName = customerName.trim().split(/\s+/)[0];

      const { output } = await generateText({
        model: openai('gpt-5-nano'),
        output: Output.object({ schema: resolutionSchema }),
        prompt: `You are a helpdesk AI assistant for Code with Mosh. Use ONLY the knowledge base below to decide whether you can confidently resolve this support ticket without human involvement.

Follow the "Escalation Rules" section of the knowledge base exactly — if any rule applies, or you're not confident the knowledge base covers this ticket, you must not resolve it yourself.

If you CAN resolve it:
- Set canResolve to true.
- Write a professional, friendly reply addressed to ${firstName} by first name.
- Use clear, well-formatted paragraphs — do not copy the knowledge base's raw dash-list formatting verbatim.
- Close with a warm, friendly sign-off from "The Support Team".

If you CANNOT confidently resolve it:
- Set canResolve to false.
- Leave reply as an empty string.

Knowledge Base:
"""
${KNOWLEDGE_BASE}
"""

Ticket Subject: ${subject}
Ticket Message: ${body}`,
      });

      if (output.canResolve) {
        await prisma.$transaction([
          prisma.ticketReply.create({
            data: { ticketId: id, authorType: ReplyAuthorType.AI, body: output.reply },
          }),
          prisma.ticket.update({
            where: { id },
            data: { status: TicketStatus.RESOLVED },
          }),
        ]);

        await sendTicketReplyEmail({
          ticketId: id,
          ticketSubject: subject,
          customerEmail,
          replyBody: output.reply,
        });
      } else {
        await prisma.ticket.update({
          where: { id },
          data: { status: TicketStatus.OPEN },
        });
      }
    } catch (err) {
      console.error(`Failed to auto-resolve ticket ${id}:`, err);
      Sentry.captureException(err);
      await prisma.ticket.update({
        where: { id },
        data: { status: TicketStatus.OPEN },
      });
    }
  });
}

export function resolveTicket(ticket: Ticket): Promise<string | null> {
  if (!process.env.OPENAI_API_KEY) return Promise.resolve(null);
  return boss.send(RESOLVE_TICKET_QUEUE, ticket);
}
