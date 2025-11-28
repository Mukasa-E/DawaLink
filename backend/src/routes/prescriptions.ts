import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  createPrescription,
  getPrescriptionById,
  listPrescriptions,
  updatePrescriptionStatus,
} from '../controllers/prescriptionsController';

const router = Router();

router.post('/', authenticate, createPrescription);
router.get('/', authenticate, listPrescriptions);
router.get('/:id', authenticate, getPrescriptionById);
router.patch('/:id/status', authenticate, updatePrescriptionStatus);

export default router;