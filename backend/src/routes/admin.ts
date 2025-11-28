import { Router } from 'express';
import { getStats, getAllUsers, getAllFacilities, approveFacility, rejectFacility } from '../controllers/adminController';
import { exportReferralsCSV, exportRecordsCSV } from '../controllers/adminController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/stats', authenticate, authorize('admin'), getStats);
router.get('/users', authenticate, authorize('admin'), getAllUsers);
router.get('/facilities', authenticate, authorize('admin'), getAllFacilities);
router.post('/facilities/:id/approve', authenticate, authorize('admin'), approveFacility);
router.post('/facilities/:id/reject', authenticate, authorize('admin'), rejectFacility);
router.get('/exports/referrals', authenticate, authorize('admin'), exportReferralsCSV);
router.get('/exports/records', authenticate, authorize('admin'), exportRecordsCSV);

export default router;

