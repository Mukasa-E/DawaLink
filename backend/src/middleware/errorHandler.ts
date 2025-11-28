import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  // Zod validation
  if (err instanceof ZodError) {
    return res.status(400).json({
      message: 'Validation failed',
      issues: err.issues.map(i => ({ path: i.path, message: i.message }))
    });
  }

  // Prisma errors (basic detection)
  if (err?.code === 'P2002') {
    return res.status(409).json({ message: 'Conflict: duplicate record', meta: err.meta });
  }

  if (err?.code === 'P2025') {
    return res.status(404).json({ message: 'Resource not found', meta: err.meta });
  }

  // Custom known error shape
  if (err?.status && err?.message) {
    return res.status(err.status).json({ message: err.message, details: err.details });
  }

  console.error('Unhandled error:', err);
  return res.status(500).json({ message: 'Internal server error' });
}
