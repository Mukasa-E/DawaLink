import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  getMyDeliveries,
  getAvailableDeliveries,
  acceptDelivery,
  updateDeliveryStatus,
  createDeliveryAssignment,
  getDeliveryByOrderId,
} from '../controllers/deliveryController';

const router = Router();

// Protected routes - delivery agents
router.get('/my-deliveries', authenticate, authorize('delivery_agent'), getMyDeliveries);
router.get('/available', authenticate, authorize('delivery_agent'), getAvailableDeliveries);
router.post('/:id/accept', authenticate, authorize('delivery_agent'), acceptDelivery);
router.patch('/:id/status', authenticate, updateDeliveryStatus);

// Protected routes - pharmacy/admin
router.post('/assign', authenticate, authorize('pharmacy'), createDeliveryAssignment);

// Protected routes - any authenticated user
router.get('/order/:orderId', authenticate, getDeliveryByOrderId);

export default router;
