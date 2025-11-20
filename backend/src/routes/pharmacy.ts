import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  registerPharmacy,
  getPharmacyById,
  getAllPharmacies,
  updatePharmacy,
  getMyPharmacy,
  verifyPharmacy,
} from '../controllers/pharmacyController';

const router = Router();

// Public routes
router.get('/all', getAllPharmacies);
router.get('/:id', getPharmacyById);

// Protected routes
router.post('/register', authenticate, registerPharmacy);
router.get('/my/pharmacy', authenticate, authorize('pharmacy'), getMyPharmacy);
router.put('/:id', authenticate, updatePharmacy);
router.patch('/:id/verify', authenticate, authorize('admin'), verifyPharmacy);

export default router;
