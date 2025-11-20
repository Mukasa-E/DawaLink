import { Response } from 'express';
import { AuthRequest } from '../types';
import prisma from '../database/db';
import { parse } from 'csv-parse/sync';

// Upload medicines via CSV
export const uploadMedicinesCSV = async (req: AuthRequest, res: Response) => {
  try {
    const { csvData, facilityName } = req.body;

    if (!csvData || !facilityName) {
      return res.status(400).json({ message: 'CSV data and facility name are required' });
    }

    // Parse CSV data
    const records = parse(csvData, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    const medicines = [];
    for (const record of records) {
      try {
        const r = record as any; // Type assertion for CSV record
        const medicine = await prisma.facilityMedicine.create({
          data: {
            facilityName,
            name: r.name || r.Name,
            genericName: r.genericName || r['Generic Name'] || null,
            category: r.category || r.Category || 'General',
            manufacturer: r.manufacturer || r.Manufacturer || null,
            dosageForm: r.dosageForm || r['Dosage Form'] || null,
            strength: r.strength || r.Strength || null,
            stock: parseInt(r.stock || r.Stock || '0'),
            reorderLevel: parseInt(r.reorderLevel || r['Reorder Level'] || '10'),
            requiresPrescription: (r.requiresPrescription || r['Requires Prescription'])?.toLowerCase() === 'true' || 
                                 (r.requiresPrescription || r['Requires Prescription'])?.toLowerCase() === 'yes',
            notes: r.notes || r.Notes || null,
          },
        });
        medicines.push(medicine);
      } catch (error) {
        console.error(`Error creating medicine ${(record as any).name}:`, error);
      }
    }

    res.status(201).json({
      message: `Successfully uploaded ${medicines.length} medicines`,
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

    const medicines = await prisma.facilityMedicine.findMany({
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
    const facilities = await prisma.facilityMedicine.findMany({
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

    if (stock === undefined || stock < 0) {
      return res.status(400).json({ message: 'Valid stock quantity is required' });
    }

    const medicine = await prisma.facilityMedicine.update({
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

    await prisma.facilityMedicine.delete({
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

    const medicines = await prisma.facilityMedicine.findMany({
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
      facilityName,
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

    if (!facilityName || !name) {
      return res.status(400).json({ message: 'Facility name and medicine name are required' });
    }

    const medicine = await prisma.facilityMedicine.create({
      data: {
        facilityName,
        name,
        genericName: genericName || null,
        category: category || 'General',
        manufacturer: manufacturer || null,
        dosageForm: dosageForm || null,
        strength: strength || null,
        stock: parseInt(stock || '0'),
        reorderLevel: parseInt(reorderLevel || '10'),
        requiresPrescription: requiresPrescription === true || requiresPrescription === 'true',
        notes: notes || null,
      },
    });

    res.status(201).json(medicine);
  } catch (error: any) {
    console.error('Add medicine error:', error);
    res.status(500).json({ message: 'Failed to add medicine', error: error.message });
  }
};
