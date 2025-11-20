import { Request, Response } from 'express';
import prisma from '../database/db';

// Create order
export const createOrder = async (req: Request, res: Response) => {
  try {
    const authReq = req as any;
    const customerId = authReq.user?.id;
    const { pharmacyId, items, deliveryAddress, deliveryPhone, prescriptionId, notes } = req.body;
    
    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Order must have at least one item' });
    }
    
    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    // Calculate total and validate stock
    let totalAmount = 0;
    const orderItemsData = [];
    
    for (const item of items) {
      const medicine = await (prisma as any).medicine.findUnique({
        where: { id: item.medicineId },
      });
      
      if (!medicine) {
        return res.status(400).json({ message: `Medicine ${item.medicineId} not found` });
      }
      
      if (medicine.stock < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for ${medicine.name}` });
      }
      
      const subtotal = medicine.price * item.quantity;
      totalAmount += subtotal;
      
      orderItemsData.push({
        medicineId: item.medicineId,
        quantity: item.quantity,
        unitPrice: medicine.price,
        subtotal,
      });
    }
    
    // Add delivery fee (placeholder - could be calculated based on distance)
    const deliveryFee = 5.0;
    totalAmount += deliveryFee;
    
    // Create order with items
    const order = await (prisma as any).order.create({
      data: {
        customerId,
        pharmacyId,
        orderNumber,
        totalAmount,
        deliveryFee,
        deliveryAddress,
        deliveryPhone,
        prescriptionId,
        notes,
        items: {
          create: orderItemsData,
        },
      },
      include: {
        items: {
          include: {
            medicine: true,
          },
        },
        pharmacy: true,
      },
    });
    
    // Reduce stock
    for (const item of items) {
      await (prisma as any).medicine.update({
        where: { id: item.medicineId },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      });
    }
    
    // Create notification
    await (prisma as any).notification.create({
      data: {
        userId: customerId,
        orderId: order.id,
        type: 'order_confirmed',
        channel: 'in_app',
        title: 'Order Confirmed',
        message: `Your order ${orderNumber} has been confirmed and is being prepared.`,
      },
    });
    
    res.status(201).json(order);
  } catch (error: any) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get customer orders
export const getCustomerOrders = async (req: Request, res: Response) => {
  try {
    const authReq = req as any;
    const customerId = authReq.user?.id;
    
    const orders = await (prisma as any).order.findMany({
      where: { customerId },
      include: {
        pharmacy: {
          select: { id: true, name: true, address: true, phone: true },
        },
        items: {
          include: {
            medicine: {
              select: { id: true, name: true, imageUrl: true },
            },
          },
        },
        delivery: true,
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    
    res.json(orders);
  } catch (error: any) {
    console.error('Get customer orders error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get pharmacy orders
export const getPharmacyOrders = async (req: Request, res: Response) => {
  try {
    const authReq = req as any;
    const { pharmacyId } = req.params;
    
    // Verify user owns this pharmacy
    const pharmacy = await (prisma as any).pharmacy.findUnique({
      where: { id: pharmacyId },
    });
    
    if (!pharmacy || (pharmacy.ownerId !== authReq.user?.id && authReq.user?.role !== 'admin')) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const orders = await (prisma as any).order.findMany({
      where: { pharmacyId },
      include: {
        customer: {
          select: { id: true, name: true, phone: true, email: true },
        },
        items: {
          include: {
            medicine: {
              select: { id: true, name: true },
            },
          },
        },
        delivery: true,
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    
    res.json(orders);
  } catch (error: any) {
    console.error('Get pharmacy orders error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get order by ID
export const getOrderById = async (req: Request, res: Response) => {
  try {
    const authReq = req as any;
    const { id } = req.params;
    
    const order = await (prisma as any).order.findUnique({
      where: { id },
      include: {
        customer: {
          select: { id: true, name: true, phone: true, email: true },
        },
        pharmacy: {
          select: { id: true, name: true, address: true, phone: true },
        },
        items: {
          include: {
            medicine: true,
          },
        },
        prescription: true,
        delivery: {
          include: {
            deliveryAgent: {
              select: { id: true, name: true, phone: true },
            },
          },
        },
        payment: true,
      },
    });
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Check access
    const pharmacy = await (prisma as any).pharmacy.findUnique({
      where: { id: order.pharmacyId },
    });
    
    const isAuthorized = 
      authReq.user?.id === order.customerId ||
      authReq.user?.id === pharmacy?.ownerId ||
      authReq.user?.id === order.delivery?.deliveryAgentId ||
      authReq.user?.role === 'admin';
    
    if (!isAuthorized) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    res.json(order);
  } catch (error: any) {
    console.error('Get order error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update order status (pharmacy only)
export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const authReq = req as any;
    const { id } = req.params;
    const { status } = req.body;
    
    const order = await (prisma as any).order.findUnique({
      where: { id },
      include: { pharmacy: true },
    });
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    if (order.pharmacy.ownerId !== authReq.user?.id && authReq.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const updated = await (prisma as any).order.update({
      where: { id },
      data: { status },
    });
    
    // Create notification based on status
    const notificationMessages: any = {
      confirmed: 'Your order has been confirmed',
      preparing: 'Your order is being prepared',
      ready_for_pickup: 'Your order is ready for pickup',
      out_for_delivery: 'Your order is out for delivery',
      delivered: 'Your order has been delivered',
    };
    
    if (notificationMessages[status]) {
      await (prisma as any).notification.create({
        data: {
          userId: order.customerId,
          orderId: order.id,
          type: status === 'delivered' ? 'order_delivered' : 'order_preparing',
          channel: 'in_app',
          title: 'Order Update',
          message: notificationMessages[status],
        },
      });
    }
    
    res.json(updated);
  } catch (error: any) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Cancel order
export const cancelOrder = async (req: Request, res: Response) => {
  try {
    const authReq = req as any;
    const { id } = req.params;
    
    const order = await (prisma as any).order.findUnique({
      where: { id },
      include: { items: true },
    });
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    if (order.customerId !== authReq.user?.id && authReq.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({ message: 'Order cannot be cancelled at this stage' });
    }
    
    // Restore stock
    for (const item of order.items) {
      await (prisma as any).medicine.update({
        where: { id: item.medicineId },
        data: {
          stock: {
            increment: item.quantity,
          },
        },
      });
    }
    
    const updated = await (prisma as any).order.update({
      where: { id },
      data: { status: 'cancelled' },
    });
    
    res.json(updated);
  } catch (error: any) {
    console.error('Cancel order error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
