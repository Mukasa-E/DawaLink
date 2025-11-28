import { NextFunction, Response, Request } from 'express';
import prisma from '../database/db';

// Audit middleware: logs each request when the response finishes.
export const auditMiddleware = (req: Request & { user?: any }, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on('finish', async () => {
    try {
      const duration = Date.now() - start;

      // Only create lightweight logs for now. For large bodies avoid storing full payloads.
      const params: any = (req as any).params || {};
      const resourceId = (params.id || params.referralId || params.recordId) || undefined;

      const detail: any = {
        durationMs: duration,
      };
      try {
        const body = (req as any).body;
        if (body && Object.keys(body).length) {
          detail.body = body;
        }
      } catch (e) {
        // ignore
      }

      // Use any to avoid TypeScript issues before prisma client is regenerated
      try {
        await (prisma as any).auditLog.create({
          data: {
            userId: (req as any).user?.id,
            userEmail: (req as any).user?.email,
            userRole: (req as any).user?.role,
            action: `${req.method} ${(req as any).originalUrl || req.url}`,
            resourceId: resourceId,
            detail: detail,
            ip: (req as any).ip || ((req as any).headers && (req as any).headers['x-forwarded-for']) || (req as any).socket?.remoteAddress,
          },
        });
      } catch (err) {
        console.error('Audit DB create error:', err);
      }
    } catch (err) {
      // Do not block the response on logging errors
      console.error('Audit log error:', err);
    }
  });

  next();
};
