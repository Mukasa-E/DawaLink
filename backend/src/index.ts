import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeDatabase } from './database/db';
import authRoutes from './routes/auth';
import referralsRoutes from './routes/referrals';
import recordsRoutes from './routes/records';
import patientsRoutes from './routes/patients';
import adminRoutes from './routes/admin';
import medicinesRoutes from './routes/medicines';
import ordersRoutes from './routes/orders';
import pharmacyRoutes from './routes/pharmacy';
import deliveryRoutes from './routes/delivery';
import paymentsRoutes from './routes/payments';
import notificationsRoutes from './routes/notifications';
import facilityMedicinesRoutes from './routes/facilityMedicines';
import { auditMiddleware } from './middleware/audit';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
// Configure CORS. In development we allow the request origin to be
// reflected so the frontend served from e.g. localhost or 127.0.0.1
// can call the API without CORS preflight failures. In production
// use a fixed origin from CORS_ORIGIN.
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? corsOrigin : true,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Audit logging for all requests (non-blocking)
app.use(auditMiddleware);

// Initialize database
initializeDatabase();

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'DawaLink API is running' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/referrals', referralsRoutes);
app.use('/api/records', recordsRoutes);
app.use('/api/patients', patientsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/medicines', medicinesRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/pharmacy', pharmacyRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/facility-medicines', facilityMedicinesRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 DawaLink API server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 Environment: ${process.env.NODE_ENV || 'development'}`);
});

