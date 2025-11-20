import { Request, Response } from 'express';
import prisma from '../database/db';

// Search medicines across all pharmacies
export const searchMedicines = async (req: Request, res: Response) => {
  try {
    const { q, category, minPrice, maxPrice, requiresPrescription } = req.query;
    
    const where: any = {};
    
    if (q) {
      where.OR = [
        { name: { contains: q as string, mode: 'insensitive' } },
        { genericName: { contains: q as string, mode: 'insensitive' } },
      ];
    }
    
    if (category) {
      where.category = category;
    }
    
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice as string);
      if (maxPrice) where.price.lte = parseFloat(maxPrice as string);
    }
    
    if (requiresPrescription !== undefined) {
      where.requiresPrescription = requiresPrescription === 'true';
    }
    
    // Only show medicines in stock
    where.stock = { gt: 0 };
    
    const medicines = await (prisma as any).medicine.findMany({
      where,
      include: {
        pharmacy: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    
    // Return response in expected format
    res.json({
      medicines,
      pagination: {
        total: medicines.length,
        limit: 50,
        skip: 0,
        hasMore: false,
      },
    });
  } catch (error: any) {
    console.error('Search medicines error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get medicine by ID
export const getMedicineById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const medicine = await (prisma as any).medicine.findUnique({
      where: { id },
      include: {
        pharmacy: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            phone: true,
            email: true,
            operatingHours: true,
          },
        },
      },
    });
    
    if (!medicine) {
      return res.status(404).json({ message: 'Medicine not found' });
    }
    
    res.json(medicine);
  } catch (error: any) {
    console.error('Get medicine error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get all medicines for a pharmacy (for inventory management)
export const getPharmacyMedicines = async (req: Request, res: Response) => {
  try {
    const authReq = req as any;
    const { pharmacyId } = req.params;
    
    // Verify user owns this pharmacy
    const pharmacy = await (prisma as any).pharmacy.findUnique({
      where: { id: pharmacyId },
    });
    
    if (!pharmacy) {
      return res.status(404).json({ message: 'Pharmacy not found' });
    }
    
    if (pharmacy.ownerId !== authReq.user?.id && authReq.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const medicines = await (prisma as any).medicine.findMany({
      where: { pharmacyId },
      orderBy: { name: 'asc' },
    });
    
    res.json(medicines);
  } catch (error: any) {
    console.error('Get pharmacy medicines error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Add medicine to inventory (pharmacy only)
export const addMedicine = async (req: Request, res: Response) => {
  try {
    const authReq = req as any;
    const { pharmacyId } = req.params;
    const { name, genericName, category, manufacturer, description, dosageForm, strength, price, stock, requiresPrescription, imageUrl } = req.body;
    
    // Verify user owns this pharmacy
    const pharmacy = await (prisma as any).pharmacy.findUnique({
      where: { id: pharmacyId },
    });
    
    if (!pharmacy || pharmacy.ownerId !== authReq.user?.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const medicine = await (prisma as any).medicine.create({
      data: {
        pharmacyId,
        name,
        genericName,
        category,
        manufacturer,
        description,
        dosageForm,
        strength,
        price: parseFloat(price),
        stock: parseInt(stock),
        requiresPrescription: requiresPrescription === true,
        imageUrl,
      },
    });
    
    res.status(201).json(medicine);
  } catch (error: any) {
    console.error('Add medicine error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update medicine (pharmacy only)
export const updateMedicine = async (req: Request, res: Response) => {
  try {
    const authReq = req as any;
    const { id } = req.params;
    const updates = req.body;
    
    const medicine = await (prisma as any).medicine.findUnique({
      where: { id },
      include: { pharmacy: true },
    });
    
    if (!medicine) {
      return res.status(404).json({ message: 'Medicine not found' });
    }
    
    if (medicine.pharmacy.ownerId !== authReq.user?.id && authReq.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const updated = await (prisma as any).medicine.update({
      where: { id },
      data: updates,
    });
    
    res.json(updated);
  } catch (error: any) {
    console.error('Update medicine error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Delete medicine (pharmacy only)
export const deleteMedicine = async (req: Request, res: Response) => {
  try {
    const authReq = req as any;
    const { id } = req.params;
    
    const medicine = await (prisma as any).medicine.findUnique({
      where: { id },
      include: { pharmacy: true },
    });
    
    if (!medicine) {
      return res.status(404).json({ message: 'Medicine not found' });
    }
    
    if (medicine.pharmacy.ownerId !== authReq.user?.id && authReq.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    await (prisma as any).medicine.delete({ where: { id } });
    
    res.json({ message: 'Medicine deleted' });
  } catch (error: any) {
    console.error('Delete medicine error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
