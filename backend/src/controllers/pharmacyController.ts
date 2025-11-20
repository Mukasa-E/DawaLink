import { Request, Response } from 'express';
import prisma from '../database/db';

// Register new pharmacy
export const registerPharmacy = async (req: Request, res: Response) => {
  try {
    const authReq = req as any;
    const { name, licenseNumber, phone, email, address, city, operatingHours } = req.body;
    
    // Check if user already owns a pharmacy
    const existingPharmacy = await (prisma as any).pharmacy.findUnique({
      where: { ownerId: authReq.user?.id },
    });
    
    if (existingPharmacy) {
      return res.status(400).json({ message: 'User already owns a pharmacy' });
    }
    
    // Check if license number is already used
    const licenseExists = await (prisma as any).pharmacy.findUnique({
      where: { licenseNumber },
    });
    
    if (licenseExists) {
      return res.status(400).json({ message: 'License number already registered' });
    }
    
    const pharmacy = await (prisma as any).pharmacy.create({
      data: {
        name,
        ownerId: authReq.user?.id,
        licenseNumber,
        phone,
        email,
        address,
        city,
        operatingHours,
        isVerified: false, // Admin must verify
      },
    });
    
    // Update user role to pharmacy
    await (prisma as any).user.update({
      where: { id: authReq.user?.id },
      data: {
        role: 'pharmacy',
        pharmacyId: pharmacy.id,
        licenseNumber,
      },
    });
    
    res.status(201).json(pharmacy);
  } catch (error: any) {
    console.error('Register pharmacy error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get pharmacy by ID
export const getPharmacyById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const pharmacy = await (prisma as any).pharmacy.findUnique({
      where: { id },
      include: {
        owner: {
          select: { id: true, name: true, email: true, phone: true },
        },
        medicines: {
          where: { stock: { gt: 0 } },
          take: 20,
          orderBy: { name: 'asc' },
        },
      },
    });
    
    if (!pharmacy) {
      return res.status(404).json({ message: 'Pharmacy not found' });
    }
    
    res.json(pharmacy);
  } catch (error: any) {
    console.error('Get pharmacy error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get all pharmacies (public - for customer browsing)
export const getAllPharmacies = async (req: Request, res: Response) => {
  try {
    const { city, isVerified } = req.query;
    
    const where: any = {};
    
    if (city) {
      where.city = city;
    }
    
    if (isVerified !== undefined) {
      where.isVerified = isVerified === 'true';
    }
    
    const pharmacies = await (prisma as any).pharmacy.findMany({
      where,
      select: {
        id: true,
        name: true,
        address: true,
        city: true,
        phone: true,
        email: true,
        operatingHours: true,
        isVerified: true,
        _count: {
          select: { medicines: true },
        },
      },
      orderBy: { name: 'asc' },
    });
    
    res.json(pharmacies);
  } catch (error: any) {
    console.error('Get pharmacies error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update pharmacy
export const updatePharmacy = async (req: Request, res: Response) => {
  try {
    const authReq = req as any;
    const { id } = req.params;
    const updates = req.body;
    
    const pharmacy = await (prisma as any).pharmacy.findUnique({
      where: { id },
    });
    
    if (!pharmacy) {
      return res.status(404).json({ message: 'Pharmacy not found' });
    }
    
    if (pharmacy.ownerId !== authReq.user?.id && authReq.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Don't allow changing verification status unless admin
    if (updates.isVerified !== undefined && authReq.user?.role !== 'admin') {
      delete updates.isVerified;
    }
    
    const updated = await (prisma as any).pharmacy.update({
      where: { id },
      data: updates,
    });
    
    res.json(updated);
  } catch (error: any) {
    console.error('Update pharmacy error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get my pharmacy (for pharmacy owners)
export const getMyPharmacy = async (req: Request, res: Response) => {
  try {
    const authReq = req as any;
    
    const pharmacy = await (prisma as any).pharmacy.findUnique({
      where: { ownerId: authReq.user?.id },
      include: {
        medicines: {
          orderBy: { name: 'asc' },
        },
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });
    
    if (!pharmacy) {
      return res.status(404).json({ message: 'No pharmacy found for this user' });
    }
    
    res.json(pharmacy);
  } catch (error: any) {
    console.error('Get my pharmacy error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Admin: Verify pharmacy
export const verifyPharmacy = async (req: Request, res: Response) => {
  try {
    const authReq = req as any;
    const { id } = req.params;
    const { isVerified } = req.body;
    
    if (authReq.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    const pharmacy = await (prisma as any).pharmacy.update({
      where: { id },
      data: { isVerified },
    });
    
    res.json(pharmacy);
  } catch (error: any) {
    console.error('Verify pharmacy error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
