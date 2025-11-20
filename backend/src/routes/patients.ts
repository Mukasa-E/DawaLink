import { Router } from 'express';
import {
  searchPatients,
  getPatientById,
  authorizeAccess,
  revokeAccess,
} from '../controllers/patientsController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/search', authenticate, authorize('healthcare_provider', 'admin'), searchPatients);
router.get('/:id', authenticate, authorize('healthcare_provider', 'admin'), getPatientById);
router.post('/:id/authorize', authenticate, authorize('healthcare_provider', 'admin'), authorizeAccess);
router.delete('/:id/authorize', authenticate, authorize('healthcare_provider', 'admin'), revokeAccess);

export default router;

