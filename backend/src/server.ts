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

  const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
  app.use(cors({
    origin: process.env.NODE_ENV === 'production' ? corsOrigin : true,
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
