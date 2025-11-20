import { Request, Response } from 'express';
import prisma from '../database/db';

// Get all delivery assignments for a delivery agent
export const getMyDeliveries = async (req: Request, res: Response) => {
  try {
    const authReq = req as any;
    const { status } = req.query;
    
    const where: any = {
      deliveryAgentId: authReq.user?.id,
    };
    
    if (status) {
      where.status = status;
    }
    
    const deliveries = await (prisma as any).deliveryAssignment.findMany({
      where,
      include: {
        order: {
          include: {
            customer: {
              select: { id: true, name: true, phone: true },
            },
            pharmacy: {
              select: { id: true, name: true, address: true, phone: true },
            },
            items: {
              include: {
                medicine: {
                  select: { id: true, name: true },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    
    res.json(deliveries);
  } catch (error: any) {
    console.error('Get my deliveries error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get unassigned deliveries (for delivery agents to pick)
export const getAvailableDeliveries = async (req: Request, res: Response) => {
  try {
    const deliveries = await (prisma as any).deliveryAssignment.findMany({
      where: {
        status: 'pending',
        deliveryAgentId: null,
      },
      include: {
        order: {
          include: {
            pharmacy: {
              select: { id: true, name: true, address: true, city: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
      take: 20,
    });
    
    res.json(deliveries);
  } catch (error: any) {
    console.error('Get available deliveries error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Assign delivery to self (delivery agent picks a delivery)
export const acceptDelivery = async (req: Request, res: Response) => {
  try {
    const authReq = req as any;
    const { id } = req.params;
    
    const delivery = await (prisma as any).deliveryAssignment.findUnique({
      where: { id },
    });
    
    if (!delivery) {
      return res.status(404).json({ message: 'Delivery not found' });
    }
    
    if (delivery.deliveryAgentId && delivery.deliveryAgentId !== authReq.user?.id) {
      return res.status(400).json({ message: 'Delivery already assigned' });
    }
    
    const updated = await (prisma as any).deliveryAssignment.update({
      where: { id },
      data: {
        deliveryAgentId: authReq.user?.id,
        status: 'assigned',
      },
      include: {
        order: true,
      },
    });
    
    // Update order status
    await (prisma as any).order.update({
      where: { id: delivery.orderId },
      data: { status: 'out_for_delivery' },
    });
    
    // Notify customer
    await (prisma as any).notification.create({
      data: {
        userId: updated.order.customerId,
        orderId: delivery.orderId,
        type: 'delivery_assigned',
        channel: 'in_app',
        title: 'Delivery Assigned',
        message: 'A delivery agent has been assigned to your order.',
      },
    });
    
    res.json(updated);
  } catch (error: any) {
    console.error('Accept delivery error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update delivery status
export const updateDeliveryStatus = async (req: Request, res: Response) => {
  try {
    const authReq = req as any;
    const { id } = req.params;
    const { status, latitude, longitude, notes } = req.body;
    
    const delivery = await (prisma as any).deliveryAssignment.findUnique({
      where: { id },
      include: { order: true },
    });
    
    if (!delivery) {
      return res.status(404).json({ message: 'Delivery not found' });
    }
    
    if (delivery.deliveryAgentId !== authReq.user?.id && authReq.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const updateData: any = { status };
    
    if (latitude) updateData.latitude = latitude;
    if (longitude) updateData.longitude = longitude;
    if (notes) updateData.notes = notes;
    
    if (status === 'picked_up') {
      updateData.pickupTime = new Date();
    } else if (status === 'delivered') {
      updateData.deliveryTime = new Date();
      // Update order status
      await (prisma as any).order.update({
        where: { id: delivery.orderId },
        data: { status: 'delivered' },
      });
      
      // Notify customer
      await (prisma as any).notification.create({
        data: {
          userId: delivery.order.customerId,
          orderId: delivery.orderId,
          type: 'order_delivered',
          channel: 'in_app',
          title: 'Order Delivered',
          message: 'Your order has been delivered successfully.',
        },
      });
    }
    
    const updated = await (prisma as any).deliveryAssignment.update({
      where: { id },
      data: updateData,
    });
    
    res.json(updated);
  } catch (error: any) {
    console.error('Update delivery status error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Create delivery assignment (when order is ready)
export const createDeliveryAssignment = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.body;
    
    // Check if delivery already exists
    const existing = await (prisma as any).deliveryAssignment.findUnique({
      where: { orderId },
    });
    
    if (existing) {
      return res.status(400).json({ message: 'Delivery assignment already exists' });
    }
    
    const delivery = await (prisma as any).deliveryAssignment.create({
      data: {
        orderId,
        status: 'pending',
      },
      include: {
        order: {
          include: {
            customer: {
              select: { id: true, name: true, phone: true },
            },
            pharmacy: {
              select: { id: true, name: true, address: true },
            },
          },
        },
      },
    });
    
    res.status(201).json(delivery);
  } catch (error: any) {
    console.error('Create delivery assignment error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get delivery by order ID
export const getDeliveryByOrderId = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    
    const delivery = await (prisma as any).deliveryAssignment.findUnique({
      where: { orderId },
      include: {
        deliveryAgent: {
          select: { id: true, name: true, phone: true },
        },
        order: {
          include: {
            pharmacy: {
              select: { name: true, address: true, phone: true },
            },
          },
        },
      },
    });
    
    if (!delivery) {
      return res.status(404).json({ message: 'Delivery not found' });
    }
    
    res.json(delivery);
  } catch (error: any) {
    console.error('Get delivery error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
