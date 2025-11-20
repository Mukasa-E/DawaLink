import { Router } from 'express';
import {
  getAllReferrals,
  getReferralById,
  createReferral,
  updateReferral,
  getReferralQR,
} from '../controllers/referralsController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getAllReferrals);
router.get('/:id', authenticate, getReferralById);
router.post('/', authenticate, authorize('healthcare_provider', 'admin'), createReferral);
router.put('/:id', authenticate, updateReferral);
router.get('/:id/qr', authenticate, getReferralQR);

export default router;

