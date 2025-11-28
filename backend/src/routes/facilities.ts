import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  registerFacility,
  getFacility,
  getFacilities,
  updateFacility,
  verifyFacility,
  getFacilityStats,
  addProviderToFacility,
  removeProviderFromFacility,
  getPendingProviders,
  approveProvider,
  rejectProvider
} from '../controllers/facilitiesController';

const router = Router();

// Public routes
router.get('/', getFacilities); // Get all facilities (with optional filters)

// Protected routes
router.post('/', authenticate, registerFacility); // Register a new facility
router.get('/:id', authenticate, getFacility); // Get facility details
router.put('/:id', authenticate, updateFacility); // Update facility
router.get('/:id/stats', authenticate, getFacilityStats); // Get facility statistics

// Admin only routes
router.put('/:id/verify', authenticate, authorize(['admin']), verifyFacility); // Verify facility

// Facility management routes
router.post('/:id/providers', authenticate, authorize(['facility_admin', 'admin']), addProviderToFacility);
router.delete('/:id/providers/:providerId', authenticate, authorize(['facility_admin', 'admin']), removeProviderFromFacility);

// Provider approval routes
router.get('/pending/providers', authenticate, authorize(['facility_admin', 'admin']), getPendingProviders);
router.post('/providers/:providerId/approve', authenticate, authorize(['facility_admin', 'admin']), approveProvider);
router.post('/providers/:providerId/reject', authenticate, authorize(['facility_admin', 'admin']), rejectProvider);

export default router;
