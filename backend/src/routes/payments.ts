import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  processPayment,
  verifyMobilePayment,
  verifyCardPayment,
  getPaymentHistory,
  refundPayment,
  getPaymentByOrderId,
} from '../controllers/paymentsController';

const router = Router();

// Protected routes - customers
router.post('/process', authenticate, processPayment);
router.post('/verify-mobile', authenticate, verifyMobilePayment);
router.post('/verify-card', authenticate, verifyCardPayment);

// Protected routes - get payment info
router.get('/history', authenticate, getPaymentHistory);
router.get('/order/:orderId', authenticate, getPaymentByOrderId);

// Protected routes - admin only
router.post('/:id/refund', authenticate, authorize('admin'), refundPayment);

export default router;
