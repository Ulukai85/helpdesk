import { generateText, Output } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { TicketCategory } from '@helpdesk/core';
import { prisma } from './prisma';

const classificationSchema = z.object({ category: z.enum(TicketCategory) });

type Ticket = { id: number; subject: string; body: string };

export function classifyTicket(ticket: Ticket): void {
  generateText({
    model: openai('gpt-5-nano'),
    output: Output.object({ schema: classificationSchema }),
    prompt: `You are a helpdesk assistant. Classify the following support ticket into exactly one category.

Categories:
- GENERAL_QUESTION: general inquiries not related to a technical issue or a refund
- TECHNICAL_QUESTION: technical issues, bugs, or how-to questions about the product
- REFUND_REQUEST: requests for a refund, cancellation, or billing dispute

Subject: ${ticket.subject}
Message: ${ticket.body}`,
  })
    .then(({ output }) =>
      prisma.ticket.update({
        where: { id: ticket.id },
        data: { category: output.category },
      }),
    )
    .catch((err) => {
      console.error(`Failed to classify ticket ${ticket.id}:`, err);
    });
}
