import { Router } from 'express';
import {
  uploadMedicinesCSV,
  getFacilityMedicines,
  getAllFacilities,
  updateMedicineStock,
  deleteMedicine,
  getLowStockMedicines,
  addMedicine,
} from '../controllers/facilityMedicinesController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Admin and healthcare providers can manage facility medicines
router.post('/upload', authorize('admin', 'healthcare_provider'), uploadMedicinesCSV);
router.post('/', authorize('admin', 'healthcare_provider'), addMedicine);
router.get('/facilities', getAllFacilities);
router.get('/:facilityName', getFacilityMedicines);
router.get('/:facilityName/low-stock', authorize('admin', 'healthcare_provider'), getLowStockMedicines);
router.patch('/:id/stock', authorize('admin', 'healthcare_provider'), updateMedicineStock);
router.delete('/:id', authorize('admin'), deleteMedicine);

export default router;
