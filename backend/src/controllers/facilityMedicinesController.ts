import { Response } from 'express';
import { AuthRequest } from '../types';
import prisma from '../database/db';
import { parse } from 'csv-parse/sync';
import { FacilityMedicineCreateSchema, FacilityMedicinesCSVRecordSchema } from '../middleware/validation';

// Type-safe Prisma client helper
const db = prisma as any;

// Upload medicines via CSV
export const uploadMedicinesCSV = async (req: AuthRequest, res: Response) => {
  try {
    const { csvData } = req.body;
    const user = req.user;

    // Only facility_admin can upload medicines
    if (user?.role !== 'facility_admin') {
      return res.status(403).json({ message: 'Only facility administrators can upload medicines' });
    }

    // User must have a facility
    if (!user.facilityId) {
      return res.status(400).json({ message: 'User is not associated with any facility' });
    }

    if (!csvData) {
      return res.status(400).json({ message: 'CSV data is required' });
    }

    // Get facility details to use facility name
    const facility = await (prisma as any).facility.findUnique({
      where: { id: user.facilityId }
    });

    if (!facility) {
      return res.status(404).json({ message: 'Facility not found' });
    }

    const facilityName = facility.name;

    // Parse CSV data
    const records = parse(csvData, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
    });

    const medicines = [];
    for (const record of records) {
      const parsed = FacilityMedicinesCSVRecordSchema.safeParse(record);
      if (!parsed.success) {
        console.warn('Skipping invalid CSV row:', parsed.error.issues.map(i => i.message));
        continue;
      }
      const r = parsed.data as any;
      const nameValue = r.name || r.Name;
      if (!nameValue) { console.warn('Skipping row without name'); continue; }
      try {
        const medicine = await db.facilityMedicine.create({
          data: {
            facilityName,
            name: nameValue,
            genericName: r.genericName || r['Generic Name'] || null,
            category: r.category || r.Category || 'General',
            manufacturer: r.manufacturer || r.Manufacturer || null,
            dosageForm: r.dosageForm || r['Dosage Form'] || null,
            strength: r.strength || r.Strength || null,
            stock: parseInt(r.stock || r.Stock || '0'),
            reorderLevel: parseInt(r.reorderLevel || r['Reorder Level'] || '10'),
            requiresPrescription: (r.requiresPrescription || r['Requires Prescription'])?.toLowerCase() === 'true' ||
              (r.requiresPrescription || r['Requires Prescription'])?.toLowerCase() === 'yes',
            price: parseFloat(r.price || r.Price || '0'),
            notes: r.notes || r.Notes || null,
          },
        });
        medicines.push(medicine);
      } catch (error: any) {
        if (error.code === 'P2002') {
          console.warn('Duplicate medicine skipped:', nameValue);
          continue;
        }
        console.error(`Error creating medicine ${nameValue}:`, error.message);
      }
    }

    res.status(201).json({
      message: `Successfully uploaded ${medicines.length} medicines for ${facilityName}`,
      count: medicines.length,
      medicines,
    });
  } catch (error: any) {
    console.error('Upload medicines error:', error);
    res.status(500).json({ message: 'Failed to upload medicines', error: error.message });
  }
};

// Get all medicines for a facility
export const getFacilityMedicines = async (req: AuthRequest, res: Response) => {
  try {
    const { facilityName } = req.params;
    const { search, category } = req.query;

    const where: any = { facilityName };

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { genericName: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.category = category;
    }

    const medicines = await db.facilityMedicine.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    res.json(medicines);
  } catch (error: any) {
    console.error('Get facility medicines error:', error);
    res.status(500).json({ message: 'Failed to fetch medicines', error: error.message });
  }
};

// Get all facilities with medicines
export const getAllFacilities = async (req: AuthRequest, res: Response) => {
  try {
    const facilities = await db.facilityMedicine.findMany({
      select: {
        facilityName: true,
      },
      distinct: ['facilityName'],
    });

    const facilityList = facilities.map((f: any) => f.facilityName).sort();

    res.json(facilityList);
  } catch (error: any) {
    console.error('Get facilities error:', error);
    res.status(500).json({ message: 'Failed to fetch facilities', error: error.message });
  }
};

// Update medicine stock
export const updateMedicineStock = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { stock } = req.body;
    const user = req.user;

    // Only facility_admin can update medicines
    if (user?.role !== 'facility_admin') {
      return res.status(403).json({ message: 'Only facility administrators can update medicines' });
    }

    if (!user.facilityId) {
      return res.status(400).json({ message: 'User is not associated with any facility' });
    }

    if (stock === undefined || stock < 0) {
      return res.status(400).json({ message: 'Valid stock quantity is required' });
    }

    // Get facility details
    const facility = await (prisma as any).facility.findUnique({
      where: { id: user.facilityId }
    });

    if (!facility) {
      return res.status(404).json({ message: 'Facility not found' });
    }

    // Verify the medicine belongs to this facility
    const existingMedicine = await db.facilityMedicine.findUnique({
      where: { id }
    });

    if (!existingMedicine) {
      return res.status(404).json({ message: 'Medicine not found' });
    }

    if (existingMedicine.facilityName !== facility.name) {
      return res.status(403).json({ message: 'You can only update medicines for your own facility' });
    }

    const medicine = await db.facilityMedicine.update({
      where: { id },
      data: { stock: parseInt(stock) },
    });

    res.json(medicine);
  } catch (error: any) {
    console.error('Update stock error:', error);
    res.status(500).json({ message: 'Failed to update stock', error: error.message });
  }
};

// Delete medicine
export const deleteMedicine = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user;

    // Only facility_admin can delete medicines
    if (user?.role !== 'facility_admin') {
      return res.status(403).json({ message: 'Only facility administrators can delete medicines' });
    }

    if (!user.facilityId) {
      return res.status(400).json({ message: 'User is not associated with any facility' });
    }

    // Get facility details
    const facility = await (prisma as any).facility.findUnique({
      where: { id: user.facilityId }
    });

    if (!facility) {
      return res.status(404).json({ message: 'Facility not found' });
    }

    // Verify the medicine belongs to this facility
    const existingMedicine = await db.facilityMedicine.findUnique({
      where: { id }
    });

    if (!existingMedicine) {
      return res.status(404).json({ message: 'Medicine not found' });
    }

    if (existingMedicine.facilityName !== facility.name) {
      return res.status(403).json({ message: 'You can only delete medicines for your own facility' });
    }

    await db.facilityMedicine.delete({
      where: { id },
    });

    res.json({ message: 'Medicine deleted successfully' });
  } catch (error: any) {
    console.error('Delete medicine error:', error);
    res.status(500).json({ message: 'Failed to delete medicine', error: error.message });
  }
};

// Get low stock medicines for a facility
export const getLowStockMedicines = async (req: AuthRequest, res: Response) => {
  try {
    const { facilityName } = req.params;

    const medicines = await db.facilityMedicine.findMany({
      where: {
        facilityName,
      },
    });

    // Filter in JavaScript since MongoDB doesn't support field comparison in where clause easily
    const lowStock = medicines.filter((m: any) => m.stock <= m.reorderLevel);

    res.json(lowStock);
  } catch (error: any) {
    console.error('Get low stock medicines error:', error);
    res.status(500).json({ message: 'Failed to fetch low stock medicines', error: error.message });
  }
};

// Add single medicine
export const addMedicine = async (req: AuthRequest, res: Response) => {
  try {
    const {
      name,
      genericName,
      category,
      manufacturer,
      dosageForm,
      strength,
      stock,
      reorderLevel,
      requiresPrescription,
      notes,
    } = req.body;

    const user = req.user;

    // Only facility_admin can add medicines
    if (user?.role !== 'facility_admin') {
      return res.status(403).json({ message: 'Only facility administrators can add medicines' });
    }

    // User must have a facility
    if (!user.facilityId) {
      return res.status(400).json({ message: 'User is not associated with any facility' });
    }

    if (!name) {
      return res.status(400).json({ message: 'Medicine name is required' });
    }

    // Get facility details
    const facility = await (prisma as any).facility.findUnique({
      where: { id: user.facilityId }
    });

    if (!facility) {
      return res.status(404).json({ message: 'Facility not found' });
    }

    const facilityName = facility.name;

    const parsedBody = FacilityMedicineCreateSchema.safeParse(req.body);
    if (!parsedBody.success) {
      return res.status(400).json({ message: 'Validation failed', issues: parsedBody.error.issues });
    }
    const body = parsedBody.data as any;
    // Normalize requiresPrescription
    const requiresRx = body.requiresPrescription === true || String(body.requiresPrescription).toLowerCase() === 'true';
    try {
      const medicine = await db.facilityMedicine.create({
        data: {
          facilityName,
          name: body.name,
          genericName: body.genericName || null,
          category: body.category || 'General',
          manufacturer: body.manufacturer || null,
          dosageForm: body.dosageForm || null,
          strength: body.strength || null,
          stock: body.stock,
          reorderLevel: body.reorderLevel,
          requiresPrescription: requiresRx,
          price: body.price,
          notes: body.notes || null,
        },
      });
      return res.status(201).json(medicine);
    } catch (error: any) {
      if (error.code === 'P2002') {
        return res.status(409).json({ message: 'Medicine with same name already exists for facility' });
      }
      throw error;
    }
  } catch (error: any) {
    console.error('Add medicine error:', error);
    res.status(500).json({ message: 'Failed to add medicine', error: error.message });
  }
};

