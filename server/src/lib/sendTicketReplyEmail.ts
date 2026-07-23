import { PgBoss } from 'pg-boss';
import * as Sentry from '@sentry/node';
import sgMail from '@sendgrid/mail';

const SEND_TICKET_REPLY_EMAIL_QUEUE = 'send-ticket-reply-email';

type TicketReplyEmail = {
  ticketId: number;
  ticketSubject: string;
  customerEmail: string;
  replyBody: string;
};

export const boss = new PgBoss({ connectionString: process.env.DATABASE_URL });
boss.on('error', (err) => {
  console.error(err);
  Sentry.captureException(err);
});

export async function startSendTicketReplyEmailWorker(): Promise<void> {
  if (!process.env.SENDGRID_API_KEY) return;

  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  await boss.start();
  await boss.createQueue(SEND_TICKET_REPLY_EMAIL_QUEUE, {
    retryLimit: 3,
    retryBackoff: true,
  });

  await boss.work<TicketReplyEmail>(
    SEND_TICKET_REPLY_EMAIL_QUEUE,
    async ([job]) => {
      const { ticketId, ticketSubject, customerEmail, replyBody } = job.data;

      // Embed #<id> so a customer reply-by-email threads back to this ticket — see extractTicketId in routes/webhooks.ts.
      await sgMail.send({
        to: customerEmail,
        from: process.env.SENDGRID_FROM_EMAIL!,
        subject: `Re: ${ticketSubject} (#${ticketId})`,
        text: replyBody,
      });
    },
  );
}

export function sendTicketReplyEmail(
  email: TicketReplyEmail,
): Promise<string | null> {
  if (!process.env.SENDGRID_API_KEY) return Promise.resolve(null);
  return boss.send(SEND_TICKET_REPLY_EMAIL_QUEUE, email);
}
