import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  grantAuthorization,
  revokeAuthorization,
  getPatientAuthorizations,
  getProviderAuthorizations,
  checkAuthorization
} from '../controllers/authorizationsController';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Patient routes
router.post('/', authorize(['patient']), grantAuthorization); // Grant access to provider/facility
router.get('/patient', getPatientAuthorizations); // Get all authorizations granted by patient
router.delete('/:id', revokeAuthorization); // Revoke authorization

// Provider routes
router.get('/provider', authorize(['healthcare_provider', 'facility_admin', 'admin']), getProviderAuthorizations);

// Check authorization
router.get('/check', checkAuthorization); // Check if provider has access to patient

export default router;
