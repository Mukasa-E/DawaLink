import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  createOrder,
  getMyOrders,
  getFacilityOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
} from '../controllers/ordersController';

const router = Router();

// Patient creates order
router.post('/', authenticate, createOrder);

// Patient lists own orders
router.get('/my', authenticate, getMyOrders);

// Patient cancels own order
router.post('/:id/cancel', authenticate, cancelOrder);

// Facility admin lists facility orders
router.get('/facility', authenticate, getFacilityOrders);

// Facility admin updates status
router.patch('/:id/status', authenticate, updateOrderStatus);

// Get single order (access controlled in controller)
router.get('/:id', authenticate, getOrderById);

export default router;
