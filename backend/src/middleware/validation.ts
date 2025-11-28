import { ZodSchema, z } from 'zod';
import { Request, Response, NextFunction } from 'express';

// Generic validator middleware factory
export const validateBody = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      const issues = parsed.error.issues.map(i => ({ path: i.path, message: i.message }));
      return res.status(400).json({ message: 'Validation failed', issues });
    }
    // Replace body with parsed data for downstream type safety
    req.body = parsed.data as any;
    next();
  };
};

// Schemas
export const PrescriptionCreateSchema = z.object({
  patientId: z.string().min(1, 'patientId is required'),
  facilityId: z.string().min(1, 'facilityId is required'),
  diagnosis: z.string().optional(),
  notes: z.string().optional(),
  medicines: z.array(
    z.object({
      facilityMedicineId: z.string().min(1, 'facilityMedicineId required').optional(),
      name: z.string().optional(),
      dosage: z.string().optional(),
      frequency: z.string().optional(),
      duration: z.string().optional(),
    })
  ).optional(),
});

export const OrderCreateSchema = z.object({
  facilityId: z.string().min(1, 'facilityId is required'),
  prescriptionId: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(
    z.object({
      facilityMedicineId: z.string().min(1, 'facilityMedicineId required'),
      quantity: z.number().int().positive('quantity must be > 0'),
    })
  ).min(1, 'At least one order item is required'),
});

export const FacilityMedicineCreateSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 chars'),
  genericName: z.string().optional(),
  category: z.string().optional(),
  manufacturer: z.string().optional(),
  dosageForm: z.string().optional(),
  strength: z.string().optional(),
  stock: z.preprocess(v => parseInt(String(v || '0'), 10), z.number().int().nonnegative()),
  reorderLevel: z.preprocess(v => parseInt(String(v || '10'), 10), z.number().int().nonnegative()),
  requiresPrescription: z.union([z.boolean(), z.string()]).optional(),
  price: z.preprocess(v => parseFloat(String(v || '0')), z.number().nonnegative()),
  notes: z.string().optional(),
});

export const FacilityMedicinesCSVRecordSchema = z.object({
  name: z.string().optional(),
  Name: z.string().optional(),
  genericName: z.string().optional(),
  'Generic Name': z.string().optional(),
  category: z.string().optional(),
  Category: z.string().optional(),
  manufacturer: z.string().optional(),
  Manufacturer: z.string().optional(),
  dosageForm: z.string().optional(),
  'Dosage Form': z.string().optional(),
  strength: z.string().optional(),
  Strength: z.string().optional(),
  stock: z.string().optional(),
  Stock: z.string().optional(),
  reorderLevel: z.string().optional(),
  'Reorder Level': z.string().optional(),
  requiresPrescription: z.string().optional(),
  'Requires Prescription': z.string().optional(),
  price: z.string().optional(),
  Price: z.string().optional(),
  notes: z.string().optional(),
  Notes: z.string().optional(),
});

// Referral creation schema
export const ReferralCreateSchema = z.object({
  patientId: z.string().min(1, 'patientId is required'),
  patientAge: z.number().int().positive().optional(),
  patientGender: z.string().optional(),
  referringFacilityId: z.string().optional(), // Allow provider to specify their facility
  receivingFacilityId: z.string().optional(),
  receivingProviderId: z.string().optional(), // Allow targeting specific provider
  reason: z.string().min(3, 'reason is required'),
  clinicalSummary: z.string().min(3, 'clinicalSummary is required'),
  diagnosis: z.string().optional(),
  vitalSigns: z.any().optional(),
  testResults: z.any().optional(),
  treatmentGiven: z.string().optional(),
  recommendations: z.string().optional(),
  urgencyLevel: z.enum(['emergency','urgent','routine']).optional(),
});

// Medical record creation schema
export const MedicalRecordCreateSchema = z.object({
  patientId: z.string().min(1, 'patientId is required'),
  recordType: z.string().min(1, 'recordType is required'),
  title: z.string().min(2, 'title required'),
  description: z.string().min(2, 'description required'),
  diagnosis: z.string().optional(),
  treatment: z.string().optional(),
  medications: z.any().optional(),
  vitalSigns: z.any().optional(),
  labResults: z.any().optional(),
  attachments: z.any().optional(),
  visitDate: z.string().optional(),
  isConfidential: z.boolean().optional(),
  shareableViaQR: z.boolean().optional(),
});
