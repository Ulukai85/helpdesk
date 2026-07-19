import { PgBoss } from 'pg-boss';
import { generateText, Output } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { TicketCategory } from '@helpdesk/core';
import { prisma } from './prisma';

const CLASSIFY_TICKET_QUEUE = 'classify-ticket';

const classificationSchema = z.object({ category: z.enum(TicketCategory) });

type Ticket = { id: number; subject: string; body: string };

export const boss = new PgBoss({ connectionString: process.env.DATABASE_URL });
boss.on('error', console.error);

export async function startClassifyTicketWorker(): Promise<void> {
  await boss.start();
  await boss.createQueue(CLASSIFY_TICKET_QUEUE, {
    retryLimit: 3,
    retryBackoff: true,
  });

  await boss.work<Ticket>(CLASSIFY_TICKET_QUEUE, async ([job]) => {
    const { output } = await generateText({
      model: openai('gpt-5-nano'),
      output: Output.object({ schema: classificationSchema }),
      prompt: `You are a helpdesk assistant. Classify the following support ticket into exactly one category.

Categories:
- GENERAL_QUESTION: general inquiries not related to a technical issue or a refund
- TECHNICAL_QUESTION: technical issues, bugs, or how-to questions about the product
- REFUND_REQUEST: requests for a refund, cancellation, or billing dispute

Subject: ${job.data.subject}
Message: ${job.data.body}`,
    });

    await prisma.ticket.update({
      where: { id: job.data.id },
      data: { category: output.category },
    });
  });
}

export function classifyTicket(ticket: Ticket): Promise<string | null> {
  return boss.send(CLASSIFY_TICKET_QUEUE, ticket);
}
