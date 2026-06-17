import { Request, Response, NextFunction } from 'express';
import { Role } from '@helpdesk/core';

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.session.user.role !== Role.ADMIN) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }
  next();
}
