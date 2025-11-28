import { Response } from 'express';
import { AuthRequest } from '../types';
import prisma from '../database/db';
import { OrderCreateSchema } from '../middleware/validation';

// Helper
const db = prisma as any;

// Create an order (patient only)
export const createOrder = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    const { facilityId, items, prescriptionId, notes } = OrderCreateSchema.parse(req.body);

    if (!user || user.role !== 'patient') {
      return res.status(403).json({ message: 'Only patients can place orders' });
    }
    if (!facilityId) {
      return res.status(400).json({ message: 'facilityId is required' });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Order must include at least one item' });
    }

    // Fetch facility
    const facility = await db.facility.findUnique({ where: { id: facilityId } });
    if (!facility) {
      return res.status(404).json({ message: 'Facility not found' });
    }

    // If prescription provided, validate ownership & facility alignment
    if (prescriptionId) {
      const prescription = await db.prescription.findUnique({ where: { id: prescriptionId } });
      if (!prescription) {
        return res.status(400).json({ message: 'Prescription not found' });
      }
      if (prescription.patientId !== user.id) {
        return res.status(403).json({ message: 'Prescription does not belong to this patient' });
      }
      if (prescription.facilityId !== facilityId) {
        return res.status(400).json({ message: 'Prescription was issued at a different facility' });
      }
      if (['cancelled','revoked'].includes(prescription.status)) {
        return res.status(400).json({ message: 'Prescription is not valid for ordering' });
      }
    }

    // Use a transaction for atomic stock check + order creation
    const result = await prisma.$transaction(async (tx: any) => {
      let totalAmount = 0;
      const orderItems: any[] = [];

      for (const raw of items) {
        const { facilityMedicineId, quantity } = raw;
        if (!facilityMedicineId || !quantity || quantity <= 0) {
          throw new Error('Each item requires facilityMedicineId and positive quantity');
        }
        const medicine = await tx.facilityMedicine.findUnique({ where: { id: facilityMedicineId } });
        if (!medicine) {
          throw new Error(`Medicine not found: ${facilityMedicineId}`);
        }
        if (medicine.facilityName !== facility.name) {
          throw new Error(`Medicine ${medicine.name} does not belong to selected facility`);
        }
        if (medicine.stock < quantity) {
          throw new Error(`Insufficient stock for ${medicine.name}`);
        }
        const unitPrice = medicine.price || 0;
        const subtotal = unitPrice * quantity;
        totalAmount += subtotal;
        orderItems.push({ facilityMedicineId, name: medicine.name, quantity, unitPrice, subtotal });
      }

      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

      const order = await tx.order.create({
        data: {
          orderNumber,
          patientId: user.id,
          facilityId,
          facilityName: facility.name,
          prescriptionId: prescriptionId || null,
          items: orderItems,
          totalAmount,
          notes: notes || null,
        },
      });

      // Decrement stock atomically within transaction
      for (const item of orderItems) {
        await tx.facilityMedicine.update({
          where: { id: item.facilityMedicineId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      // Create notification
      await tx.notification.create({
        data: {
          userId: user.id,
          orderId: order.id,
          type: 'order_created',
          title: 'Order Placed',
          message: `Your order ${orderNumber} was placed successfully`,
        },
      });

      return order;
    });

    return res.status(201).json(result);
  } catch (error: any) {
    // Differentiate validation vs server error
    const clientErrorPrefixes = [
      'Each item requires facilityMedicineId',
      'Medicine not found',
      'Medicine', // covers ownership message
      'Insufficient stock',
      'Prescription not found',
      'Prescription does not belong',
      'Prescription was issued',
      'Prescription is not valid'
    ];
    const message = error.message || 'Failed to create order';
    const isClient = clientErrorPrefixes.some(prefix => message.startsWith(prefix));
    if (isClient) {
      return res.status(400).json({ message });
    }
    console.error('Create order internal error:', error);
    return res.status(500).json({ message: 'Failed to create order', error: message });
  }
};

// List orders for patient
export const getMyOrders = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user || user.role !== 'patient') {
      return res.status(403).json({ message: 'Only patients can view their orders' });
    }
    const orders = await db.order.findMany({
      where: { patientId: user.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json(orders);
  } catch (error: any) {
    console.error('Get my orders error:', error);
    res.status(500).json({ message: 'Failed to fetch orders', error: error.message });
  }
};

// List orders for facility (facility_admin)
export const getFacilityOrders = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user || user.role !== 'facility_admin' || !user.facilityId) {
      return res.status(403).json({ message: 'Only facility administrators can view facility orders' });
    }
    const facility = await db.facility.findUnique({ where: { id: user.facilityId } });
    if (!facility) {
      return res.status(404).json({ message: 'Facility not found' });
    }
    const orders = await db.order.findMany({
      where: { facilityId: facility.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json(orders);
  } catch (error: any) {
    console.error('Get facility orders error:', error);
    res.status(500).json({ message: 'Failed to fetch facility orders', error: error.message });
  }
};

// Get order by id (patient owner or facility admin or admin)
export const getOrderById = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    const { id } = req.params;
    const order = await db.order.findUnique({ where: { id } });
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    if (!user) return res.status(401).json({ message: 'Unauthorized' });
    if (!(user.role === 'admin' || order.patientId === user.id || (user.role === 'facility_admin' && user.facilityId === order.facilityId))) {
      return res.status(403).json({ message: 'Access denied' });
    }
    res.json(order);
  } catch (error: any) {
    console.error('Get order error:', error);
    res.status(500).json({ message: 'Failed to fetch order', error: error.message });
  }
};

// Update order status (facility_admin)
export const updateOrderStatus = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    const { id } = req.params;
    const { status } = req.body;
    if (!user || user.role !== 'facility_admin' || !user.facilityId) {
      return res.status(403).json({ message: 'Only facility administrators can update order status' });
    }
    const order = await db.order.findUnique({ where: { id } });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.facilityId !== user.facilityId) {
      return res.status(403).json({ message: 'You can only manage orders for your facility' });
    }
    const validStatuses = ['pending','confirmed','preparing','ready_for_pickup','out_for_delivery','delivered','cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const updated = await db.order.update({ where: { id }, data: { status } });
    await db.notification.create({
      data: {
        userId: order.patientId,
        orderId: order.id,
        type: status === 'delivered' ? 'order_delivered' : 'order_status_updated',
        title: 'Order Status Updated',
        message: `Order ${order.orderNumber} status is now ${status}`,
      },
    });
    res.json(updated);
  } catch (error: any) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'Failed to update order status', error: error.message });
  }
};

// Cancel order (patient)
export const cancelOrder = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    const { id } = req.params;
    if (!user || user.role !== 'patient') {
      return res.status(403).json({ message: 'Only patients can cancel their orders' });
    }
    const order = await db.order.findUnique({ where: { id } });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.patientId !== user.id) return res.status(403).json({ message: 'Access denied' });
    if (!['pending','confirmed'].includes(order.status)) {
      return res.status(400).json({ message: 'Order cannot be cancelled at this stage' });
    }
    // Restore stock
    for (const item of order.items as any[]) {
      await db.facilityMedicine.update({
        where: { id: item.facilityMedicineId },
        data: { stock: { increment: item.quantity } },
      });
    }
    const updated = await db.order.update({ where: { id }, data: { status: 'cancelled' } });
    await db.notification.create({
      data: {
        userId: user.id,
        orderId: order.id,
        type: 'order_cancelled',
        title: 'Order Cancelled',
        message: `Order ${order.orderNumber} has been cancelled`,
      },
    });
    res.json(updated);
  } catch (error: any) {
    console.error('Cancel order error:', error);
    res.status(500).json({ message: 'Failed to cancel order', error: error.message });
  }
};
