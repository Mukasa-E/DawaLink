import { Router } from 'express';
import { getStats, getAllUsers } from '../controllers/adminController';
import { exportReferralsCSV, exportRecordsCSV } from '../controllers/adminController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/stats', authenticate, authorize('admin'), getStats);
router.get('/users', authenticate, authorize('admin'), getAllUsers);
router.get('/exports/referrals', authenticate, authorize('admin'), exportReferralsCSV);
router.get('/exports/records', authenticate, authorize('admin'), exportRecordsCSV);

export default router;

