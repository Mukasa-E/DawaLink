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

// Only facility_admin can manage their facility medicines
router.post('/upload', authorize(['facility_admin']), uploadMedicinesCSV);
router.post('/', authorize(['facility_admin']), addMedicine);
router.get('/facilities', getAllFacilities); // Public list of facilities with medicines
router.get('/:facilityName', getFacilityMedicines); // Anyone can view medicines
router.get('/:facilityName/low-stock', authorize(['facility_admin', 'admin']), getLowStockMedicines);
router.patch('/:id/stock', authorize(['facility_admin']), updateMedicineStock);
router.delete('/:id', authorize(['facility_admin', 'admin']), deleteMedicine);

export default router;
