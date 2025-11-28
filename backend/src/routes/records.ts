import { Router } from 'express';
import {
  getAllRecords,
  getRecordById,
  createRecord,
  updateRecord,
  getRecordByQR
} from '../controllers/recordsController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getAllRecords);
router.get('/:id', authenticate, getRecordById);
router.post('/', authenticate, authorize(['healthcare_provider', 'facility_admin', 'admin']), createRecord);
router.put('/:id', authenticate, updateRecord);
router.post('/verify-qr', authenticate, getRecordByQR);

export default router;

