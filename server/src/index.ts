import express, { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './auth';
import { prisma } from './lib/prisma';
import { requireAuth } from './middleware/requireAuth';
import { startClassifyTicketWorker } from './lib/classifyTicket';
import { startResolveTicketWorker } from './lib/resolveTicket';
import { startSendTicketReplyEmailWorker } from './lib/sendTicketReplyEmail';
import usersRouter from './routes/users';
import ticketsRouter from './routes/tickets';
import agentsRouter from './routes/agents';
import webhooksRouter from './routes/webhooks';

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(helmet());

app.use(
  cors({
    origin: process.env.CLIENT_URL ?? 'http://localhost:5173',
    credentials: true,
  }),
);

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts, please try again later.' },
  skip: () => process.env.NODE_ENV !== 'production',
});
app.use('/api/auth/sign-in', loginLimiter);

// Better Auth must come before express.json()
app.all('/api/auth/{*any}', toNodeHandler(auth));

app.use(express.json({ limit: '50kb' }));

const healthLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV !== 'production',
});

app.get('/api/health', healthLimiter, async (_req, res) => {
  await prisma.$queryRaw`SELECT 1`;
  res.json({ status: 'ok' });
});

app.get('/api/me', requireAuth, (req, res) => {
  const { id, name, email, role } = req.session.user;
  res.json({ user: { id, name, email, role } });
});

app.use('/api/users', usersRouter);
app.use('/api/tickets', ticketsRouter);
app.use('/api/agents', agentsRouter);
app.use('/api/webhooks', webhooksRouter);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({
    error:
      process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message,
  });
});

startClassifyTicketWorker().catch((err) => {
  console.error('Failed to start classify-ticket worker', err);
  process.exit(1);
});

startResolveTicketWorker().catch((err) => {
  console.error('Failed to start resolve-ticket worker', err);
  process.exit(1);
});

startSendTicketReplyEmailWorker().catch((err) => {
  console.error('Failed to start send-ticket-reply-email worker', err);
  process.exit(1);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
