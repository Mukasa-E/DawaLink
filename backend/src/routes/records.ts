import { Router } from 'express';
import {
  getAllRecords,
  getRecordById,
  createRecord,
  updateRecord,
} from '../controllers/recordsController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getAllRecords);
router.get('/:id', authenticate, getRecordById);
router.post('/', authenticate, authorize('healthcare_provider', 'admin'), createRecord);
router.put('/:id', authenticate, updateRecord);

export default router;

