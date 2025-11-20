import { Router } from 'express';
import { 
  searchMedicines, 
  getMedicineById, 
  getPharmacyMedicines, 
  addMedicine, 
  updateMedicine, 
  deleteMedicine 
} from '../controllers/medicinesController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/search', searchMedicines);
router.get('/:id', getMedicineById);

// Pharmacy routes (authenticated)
router.get('/pharmacy/:pharmacyId', authenticate, authorize('pharmacy', 'admin'), getPharmacyMedicines);
router.post('/pharmacy/:pharmacyId', authenticate, authorize('pharmacy', 'admin'), addMedicine);
router.put('/:id', authenticate, authorize('pharmacy', 'admin'), updateMedicine);
router.delete('/:id', authenticate, authorize('pharmacy', 'admin'), deleteMedicine);

export default router;
