import { Request, Response, NextFunction } from 'express';
import { timingSafeEqual } from 'crypto';

// SendGrid's Inbound Parse webhook settings only accept a target URL — there is
// no way to configure custom request headers — so the shared secret must travel
// as a query parameter on that URL instead of a header.
export function requireWebhookToken(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const secret = process.env.WEBHOOK_SECRET;

  if (!secret) {
    if (process.env.NODE_ENV !== 'production') {
      next();
      return;
    }
    console.error('WEBHOOK_SECRET is not set');
    res.status(200).json({});
    return;
  }

  const token = req.query.token;
  if (typeof token !== 'string') {
    res.status(200).json({});
    return;
  }

  const secretBuf = Buffer.from(secret);
  const tokenBuf = Buffer.from(token);

  if (
    secretBuf.byteLength !== tokenBuf.byteLength ||
    !timingSafeEqual(secretBuf, tokenBuf)
  ) {
    res.status(200).json({});
    return;
  }

  next();
}
