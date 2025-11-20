import { Request, Response } from 'express';
import prisma from '../database/db';

// Process payment for an order
export const processPayment = async (req: Request, res: Response) => {
  try {
    const authReq = req as any;
    const { orderId, method, amount, phoneNumber, cardDetails, transactionRef } = req.body;
    
    // Verify order exists and belongs to user
    const order = await (prisma as any).order.findUnique({
      where: { id: orderId },
    });
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    if (order.customerId !== authReq.user?.id && authReq.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Check if payment already exists
    const existingPayment = await (prisma as any).payment.findUnique({
      where: { orderId },
    });
    
    if (existingPayment && existingPayment.status === 'completed') {
      return res.status(400).json({ message: 'Order already paid' });
    }
    
    // Create or update payment record
    const paymentData: any = {
      orderId,
      userId: authReq.user?.id,
      amount: amount || order.totalAmount,
      method,
      status: 'pending',
    };
    
    if (phoneNumber) paymentData.phoneNumber = phoneNumber;
    if (transactionRef) paymentData.transactionRef = transactionRef;
    
    const payment = existingPayment
      ? await (prisma as any).payment.update({
          where: { id: existingPayment.id },
          data: paymentData,
        })
      : await (prisma as any).payment.create({
          data: paymentData,
        });
    
    // TODO: Integrate with actual payment provider (M-Pesa, Stripe, etc.)
    // For now, we'll just return the payment record
    // In production, this would trigger the payment gateway API
    
    res.status(201).json({
      payment,
      message: 'Payment initiated. Please complete the payment on your device.',
      // In production, include payment gateway URL or instructions
    });
  } catch (error: any) {
    console.error('Process payment error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Verify mobile money payment (M-Pesa, Airtel Money, etc.)
export const verifyMobilePayment = async (req: Request, res: Response) => {
  try {
    const { transactionRef, orderId } = req.body;
    
    if (!transactionRef && !orderId) {
      return res.status(400).json({ message: 'Transaction reference or order ID required' });
    }
    
    const where: any = {};
    if (transactionRef) where.transactionRef = transactionRef;
    if (orderId) where.orderId = orderId;
    
    const payment = await (prisma as any).payment.findFirst({
      where,
      include: { order: true },
    });
    
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    
    // TODO: Verify with actual payment provider API
    // For now, we'll simulate successful verification
    // In production, call M-Pesa/Airtel API to verify transaction
    
    const verified = await (prisma as any).payment.update({
      where: { id: payment.id },
      data: {
        status: 'completed',
        paidAt: new Date(),
      },
    });
    
    // Update order payment status
    await (prisma as any).order.update({
      where: { id: payment.orderId },
      data: { paymentStatus: 'paid' },
    });
    
    // Notify customer and pharmacy
    await (prisma as any).notification.createMany({
      data: [
        {
          userId: payment.userId,
          orderId: payment.orderId,
          type: 'payment_confirmed',
          channel: 'in_app',
          title: 'Payment Confirmed',
          message: `Your payment of ${payment.amount} has been confirmed.`,
        },
        {
          userId: payment.order.pharmacyId,
          orderId: payment.orderId,
          type: 'new_order',
          channel: 'in_app',
          title: 'New Paid Order',
          message: 'You have received a new paid order.',
        },
      ],
    });
    
    res.json(verified);
  } catch (error: any) {
    console.error('Verify mobile payment error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Handle card payment verification (Stripe, Flutterwave, etc.)
export const verifyCardPayment = async (req: Request, res: Response) => {
  try {
    const { paymentIntentId, orderId } = req.body;
    
    const payment = await (prisma as any).payment.findFirst({
      where: { orderId },
      include: { order: true },
    });
    
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    
    // TODO: Verify with Stripe/Flutterwave API
    // For now, simulate verification
    
    const verified = await (prisma as any).payment.update({
      where: { id: payment.id },
      data: {
        status: 'completed',
        transactionRef: paymentIntentId,
        paidAt: new Date(),
      },
    });
    
    // Update order
    await (prisma as any).order.update({
      where: { id: payment.orderId },
      data: { paymentStatus: 'paid' },
    });
    
    // Notify users
    await (prisma as any).notification.createMany({
      data: [
        {
          userId: payment.userId,
          orderId: payment.orderId,
          type: 'payment_confirmed',
          channel: 'in_app',
          title: 'Payment Confirmed',
          message: `Your card payment of ${payment.amount} has been confirmed.`,
        },
        {
          userId: payment.order.pharmacyId,
          orderId: payment.orderId,
          type: 'new_order',
          channel: 'in_app',
          title: 'New Paid Order',
          message: 'You have received a new paid order.',
        },
      ],
    });
    
    res.json(verified);
  } catch (error: any) {
    console.error('Verify card payment error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get payment history
export const getPaymentHistory = async (req: Request, res: Response) => {
  try {
    const authReq = req as any;
    const { limit = '10', skip = '0' } = req.query;
    
    const where: any = {};
    
    // If pharmacy user, show payments for their orders
    if (authReq.user?.role === 'pharmacy') {
      const pharmacyOrders = await (prisma as any).order.findMany({
        where: { pharmacyId: authReq.user.pharmacyId },
        select: { id: true },
      });
      where.orderId = { in: pharmacyOrders.map((o: any) => o.id) };
    } else if (authReq.user?.role !== 'admin') {
      // Regular users see only their payments
      where.userId = authReq.user?.id;
    }
    
    const payments = await (prisma as any).payment.findMany({
      where,
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            totalAmount: true,
            pharmacy: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(skip as string),
    });
    
    const total = await (prisma as any).payment.count({ where });
    
    res.json({
      payments,
      pagination: {
        total,
        limit: parseInt(limit as string),
        skip: parseInt(skip as string),
        hasMore: total > parseInt(skip as string) + payments.length,
      },
    });
  } catch (error: any) {
    console.error('Get payment history error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Refund payment (admin only)
export const refundPayment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const payment = await (prisma as any).payment.findUnique({
      where: { id },
      include: { order: true },
    });
    
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    
    if (payment.status !== 'completed') {
      return res.status(400).json({ message: 'Can only refund completed payments' });
    }
    
    // TODO: Process actual refund with payment provider
    // For now, just update status
    
    const refunded = await (prisma as any).payment.update({
      where: { id },
      data: {
        status: 'refunded',
        refundedAt: new Date(),
      },
    });
    
    // Update order
    await (prisma as any).order.update({
      where: { id: payment.orderId },
      data: { 
        paymentStatus: 'refunded',
        status: 'cancelled',
      },
    });
    
    // Notify customer
    await (prisma as any).notification.create({
      data: {
        userId: payment.userId,
        orderId: payment.orderId,
        type: 'payment_refunded',
        channel: 'in_app',
        title: 'Payment Refunded',
        message: `Your payment of ${payment.amount} has been refunded. ${reason || ''}`,
      },
    });
    
    res.json(refunded);
  } catch (error: any) {
    console.error('Refund payment error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get payment by order ID
export const getPaymentByOrderId = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const authReq = req as any;
    
    const payment = await (prisma as any).payment.findUnique({
      where: { orderId },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            customerId: true,
            pharmacyId: true,
          },
        },
      },
    });
    
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    
    // Check access
    const isOwner = payment.userId === authReq.user?.id;
    const isPharmacy = authReq.user?.role === 'pharmacy' && payment.order.pharmacyId === authReq.user.pharmacyId;
    const isAdmin = authReq.user?.role === 'admin';
    
    if (!isOwner && !isPharmacy && !isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    res.json(payment);
  } catch (error: any) {
    console.error('Get payment error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
