import { Router } from 'express';
import {
  getAllReferrals,
  getReferralById,
  createReferral,
  updateReferral,
  getReferralQR,
  verifyReferralByQR
} from '../controllers/referralsController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getAllReferrals);
router.get('/:id', authenticate, getReferralById);
router.post('/', authenticate, authorize(['healthcare_provider', 'facility_admin', 'admin']), createReferral);
router.put('/:id', authenticate, updateReferral);
router.get('/:id/qr', authenticate, getReferralQR);
router.post('/verify-qr', authenticate, verifyReferralByQR);

export default router;

