import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { initializeDatabase } from './database/db';
import authRoutes from './routes/auth';
import referralsRoutes from './routes/referrals';
import recordsRoutes from './routes/records';
import patientsRoutes from './routes/patients';
import adminRoutes from './routes/admin';
import facilitiesRoutes from './routes/facilities';
import facilityMedicinesRoutes from './routes/facilityMedicines';
import prescriptionsRoutes from './routes/prescriptions';
import ordersRoutes from './routes/orders';
import authorizationsRoutes from './routes/authorizations';
import notificationsRoutes from './routes/notifications';
import { auditMiddleware } from './middleware/audit';
import { sanitizeMiddleware } from './middleware/sanitize';
import { errorHandler } from './middleware/errorHandler';

export function buildApp() {
  const app = express();

  // Read allowed origin(s) from env. Support a comma-separated list.
  // Normalize by trimming whitespace and removing any trailing slash so
  // configuration like "https://dawa-link.vercel.app/" still matches
  // the actual request origin "https://dawa-link.vercel.app".
  const rawCors = process.env.CORS_ORIGIN || 'http://localhost:5173';
  const allowedOrigins = rawCors
    .split(',')
    .map(s => s.trim().replace(/\/$/, ''))
    .filter(Boolean);
  // Build an array of regexes to allow Vercel preview domains derived from
  // configured vercel.host entries. Example: if configured origin is
  // https://dawa-link.vercel.app we will allow
  // https://dawa-link-*.vercel.app preview domains as well.
  const allowedRegexes = allowedOrigins
    .map(o => {
      try {
        const u = new URL(o);
        const host = u.hostname;
        if (host.endsWith('.vercel.app')) {
          const base = host.replace(/\.vercel\.app$/, '');
          const esc = base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          return new RegExp(`^https://${esc}(-[a-z0-9-]+)?\\.vercel\\.app$`);
        }
      } catch (e) {
        // ignore invalid URL entries
      }
      return null;
    })
    .filter(Boolean) as RegExp[];

  app.use(cors({
    origin: (origin, callback) => {
      // Allow non-browser requests (no Origin header)
      if (!origin) return callback(null, true);
      const normalized = origin.replace(/\/$/, '');
      // Allow in non-production for convenience
      if (process.env.NODE_ENV !== 'production') return callback(null, true);
      // Exact match against configured origins
      if (allowedOrigins.includes(normalized)) return callback(null, true);
      // Allow matches against derived regexes (Vercel preview domains)
      if (allowedRegexes.some(r => r.test(normalized))) return callback(null, true);
      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
  }));
  app.use(helmet());
  app.use(express.json({ limit: '200kb' }));
  app.use(express.urlencoded({ extended: true, limit: '200kb' }));
  app.use(sanitizeMiddleware);

  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api/', apiLimiter);

  app.use(auditMiddleware);
  initializeDatabase();

  app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'DawaLink Patient Referral & Records System API is running' });
  });

  // Debug endpoint to inspect CORS configuration and request origin.
  // Useful when troubleshooting production preview domains. Returns the
  // normalized configured origins, the derived preview regexes, and the
  // incoming request Origin header. Keep lightweight and informational.
  app.get('/debug/cors', (req, res) => {
    const info = {
      envCorsRaw: rawCors,
      allowedOrigins,
      allowedRegexes: allowedRegexes.map(r => r.source),
      requestOrigin: req.headers.origin || null,
      nodeEnv: process.env.NODE_ENV || null,
    };
    res.json(info);
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/referrals', referralsRoutes);
  app.use('/api/records', recordsRoutes);
  app.use('/api/patients', patientsRoutes);
  app.use('/api/facilities', facilitiesRoutes);
  app.use('/api/facility-medicines', facilityMedicinesRoutes);
  app.use('/api/prescriptions', prescriptionsRoutes);
  app.use('/api/orders', ordersRoutes);
  app.use('/api/authorizations', authorizationsRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/notifications', notificationsRoutes);

  app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
  });
  app.use(errorHandler);

  return app;
}

export const app = buildApp();
