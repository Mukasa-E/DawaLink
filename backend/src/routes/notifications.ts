import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  sendNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getNotificationStats,
} from '../controllers/notificationsController';

const router = Router();

// Protected routes - all authenticated users
router.get('/my-notifications', authenticate, getUserNotifications);
router.patch('/:id/read', authenticate, markAsRead);
router.post('/mark-all-read', authenticate, markAllAsRead);
router.delete('/:id', authenticate, deleteNotification);

// Protected routes - admin/system
router.post('/send', authenticate, authorize('admin'), sendNotification);
router.get('/stats', authenticate, authorize('admin'), getNotificationStats);

export default router;
