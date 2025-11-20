import { Router } from 'express';
import { 
  createOrder, 
  getCustomerOrders, 
  getPharmacyOrders, 
  getOrderById, 
  updateOrderStatus, 
  cancelOrder 
} from '../controllers/ordersController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Customer routes
router.post('/', authenticate, authorize('customer', 'admin'), createOrder);
router.get('/my-orders', authenticate, authorize('customer', 'admin'), getCustomerOrders);
router.post('/:id/cancel', authenticate, authorize('customer', 'admin'), cancelOrder);

// Pharmacy routes
router.get('/pharmacy/:pharmacyId', authenticate, authorize('pharmacy', 'admin'), getPharmacyOrders);
router.patch('/:id/status', authenticate, authorize('pharmacy', 'admin'), updateOrderStatus);

// Shared routes (customer, pharmacy, delivery, admin)
router.get('/:id', authenticate, getOrderById);

export default router;
