import { Request, Response, NextFunction } from 'express';
import { timingSafeEqual } from 'crypto';

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

  const token = req.headers['x-webhook-token'];
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
