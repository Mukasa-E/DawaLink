import { Request, Response } from 'express';
import prisma from '../database/db';

// Send notification
export const sendNotification = async (req: Request, res: Response) => {
  try {
    const { userId, orderId, type, channel, title, message } = req.body;
    
    if (!userId || !type || !channel || !title || !message) {
      return res.status(400).json({ 
        message: 'Missing required fields: userId, type, channel, title, message' 
      });
    }
    
    const notification = await (prisma as any).notification.create({
      data: {
        userId,
        orderId,
        type,
        channel,
        title,
        message,
      },
    });
    
    // TODO: Integrate with actual notification services
    // - SMS: Twilio, Africa's Talking
    // - Email: SendGrid, AWS SES
    // - Push: Firebase Cloud Messaging, OneSignal
    
    if (channel === 'sms') {
      // TODO: Send SMS via provider
      console.log('SMS would be sent:', { userId, message });
    } else if (channel === 'email') {
      // TODO: Send email via provider
      console.log('Email would be sent:', { userId, title, message });
    } else if (channel === 'push') {
      // TODO: Send push notification
      console.log('Push notification would be sent:', { userId, title, message });
    }
    
    res.status(201).json(notification);
  } catch (error: any) {
    console.error('Send notification error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get user notifications
export const getUserNotifications = async (req: Request, res: Response) => {
  try {
    const authReq = req as any;
    const { limit = '20', skip = '0', unreadOnly = 'false' } = req.query;
    
    const where: any = {
      userId: authReq.user?.id,
    };
    
    if (unreadOnly === 'true') {
      where.read = false;
    }
    
    const notifications = await (prisma as any).notification.findMany({
      where,
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(skip as string),
    });
    
    const total = await (prisma as any).notification.count({ where });
    const unreadCount = await (prisma as any).notification.count({
      where: {
        userId: authReq.user?.id,
        read: false,
      },
    });
    
    res.json({
      notifications,
      unreadCount,
      pagination: {
        total,
        limit: parseInt(limit as string),
        skip: parseInt(skip as string),
        hasMore: total > parseInt(skip as string) + notifications.length,
      },
    });
  } catch (error: any) {
    console.error('Get user notifications error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Mark notification as read
export const markAsRead = async (req: Request, res: Response) => {
  try {
    const authReq = req as any;
    const { id } = req.params;
    
    const notification = await (prisma as any).notification.findUnique({
      where: { id },
    });
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    if (notification.userId !== authReq.user?.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const updated = await (prisma as any).notification.update({
      where: { id },
      data: {
        read: true,
        readAt: new Date(),
      },
    });
    
    res.json(updated);
  } catch (error: any) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Mark all notifications as read
export const markAllAsRead = async (req: Request, res: Response) => {
  try {
    const authReq = req as any;
    
    const result = await (prisma as any).notification.updateMany({
      where: {
        userId: authReq.user?.id,
        read: false,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    });
    
    res.json({ 
      message: 'All notifications marked as read',
      count: result.count,
    });
  } catch (error: any) {
    console.error('Mark all as read error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Delete notification
export const deleteNotification = async (req: Request, res: Response) => {
  try {
    const authReq = req as any;
    const { id } = req.params;
    
    const notification = await (prisma as any).notification.findUnique({
      where: { id },
    });
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    if (notification.userId !== authReq.user?.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    await (prisma as any).notification.delete({
      where: { id },
    });
    
    res.json({ message: 'Notification deleted successfully' });
  } catch (error: any) {
    console.error('Delete notification error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Helper: Send order status notification
export const sendOrderStatusNotification = async (
  orderId: string,
  customerId: string,
  pharmacyId: string,
  status: string
) => {
  try {
    const messages: Record<string, { customer: string; pharmacy?: string }> = {
      pending: {
        customer: 'Your order has been placed and is pending confirmation.',
      },
      confirmed: {
        customer: 'Your order has been confirmed by the pharmacy.',
        pharmacy: 'You have confirmed an order. Please prepare it for delivery.',
      },
      ready: {
        customer: 'Your order is ready for pickup/delivery.',
      },
      out_for_delivery: {
        customer: 'Your order is out for delivery.',
      },
      delivered: {
        customer: 'Your order has been delivered. Thank you!',
        pharmacy: 'An order has been successfully delivered.',
      },
      cancelled: {
        customer: 'Your order has been cancelled.',
        pharmacy: 'An order has been cancelled.',
      },
    };
    
    const notificationData = messages[status];
    if (!notificationData) return;
    
    // Notify customer
    await (prisma as any).notification.create({
      data: {
        userId: customerId,
        orderId,
        type: 'order_update',
        channel: 'in_app',
        title: `Order ${status.replace('_', ' ').toUpperCase()}`,
        message: notificationData.customer,
      },
    });
    
    // Notify pharmacy if applicable
    if (notificationData.pharmacy) {
      await (prisma as any).notification.create({
        data: {
          userId: pharmacyId,
          orderId,
          type: 'order_update',
          channel: 'in_app',
          title: `Order ${status.replace('_', ' ').toUpperCase()}`,
          message: notificationData.pharmacy,
        },
      });
    }
  } catch (error) {
    console.error('Send order status notification error:', error);
    // Don't throw - notifications are non-critical
  }
};

// Get notification statistics (for admin)
export const getNotificationStats = async (req: Request, res: Response) => {
  try {
    const totalNotifications = await (prisma as any).notification.count();
    const unreadNotifications = await (prisma as any).notification.count({
      where: { read: false },
    });
    
    const notificationsByType = await (prisma as any).notification.groupBy({
      by: ['type'],
      _count: true,
    });
    
    const notificationsByChannel = await (prisma as any).notification.groupBy({
      by: ['channel'],
      _count: true,
    });
    
    res.json({
      total: totalNotifications,
      unread: unreadNotifications,
      byType: notificationsByType,
      byChannel: notificationsByChannel,
    });
  } catch (error: any) {
    console.error('Get notification stats error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
