import { Response } from 'express';
import { AuthRequest } from '../types';
import prisma from '../database/db';
import { PrescriptionCreateSchema } from '../middleware/validation';

const db = prisma as any;

// Create prescription (provider or facility_admin)
export const createPrescription = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
  // Validate input
  const { patientId, facilityId, diagnosis, notes, medicines } = PrescriptionCreateSchema.parse(req.body);

    if (!user || (user.role !== 'healthcare_provider' && user.role !== 'facility_admin')) {
      return res.status(403).json({ message: 'Only providers or facility admins can create prescriptions' });
    }

    if (!patientId || !facilityId) {
      return res.status(400).json({ message: 'patientId and facilityId are required' });
    }

    const patient = await db.user.findUnique({ where: { id: patientId } });
    if (!patient || patient.role !== 'patient') {
      return res.status(400).json({ message: 'Invalid patient' });
    }

    const facility = await db.facility.findUnique({ where: { id: facilityId } });
    if (!facility) return res.status(404).json({ message: 'Facility not found' });

    // Basic medicine validation (ensure facilityMedicineIds exist & belong to facility when provided)
    let validatedMedicines: any[] | undefined = undefined;
    if (Array.isArray(medicines)) {
      validatedMedicines = [];
      for (const m of medicines) {
        const { facilityMedicineId, name, dosage, frequency, duration } = m;
        if (!facilityMedicineId && !name) {
          return res.status(400).json({ message: 'Each medicine needs facilityMedicineId or name' });
        }
        if (facilityMedicineId) {
          const fm = await db.facilityMedicine.findUnique({ where: { id: facilityMedicineId } });
          if (!fm) {
            return res.status(400).json({ message: `Facility medicine not found: ${facilityMedicineId}` });
          }
          if (fm.facilityName !== facility.name) {
            return res.status(400).json({ message: `Medicine ${fm.name} does not belong to facility` });
          }
          validatedMedicines.push({ facilityMedicineId, name: fm.name, dosage, frequency, duration });
        } else {
          validatedMedicines.push({ facilityMedicineId: null, name, dosage, frequency, duration });
        }
      }
    }

    const prescriptionNumber = `RX-${Date.now()}-${Math.random().toString(36).slice(2,8).toUpperCase()}`;

    const prescription = await db.prescription.create({
      data: {
        prescriptionNumber,
        patientId,
        providerId: user.id,
        facilityId,
        facilityName: facility.name,
        diagnosis: diagnosis || null,
        notes: notes || null,
        medicines: validatedMedicines || null,
        status: 'draft',
      },
    });

    await db.notification.create({
      data: {
        userId: patientId,
        prescriptionId: prescription.id,
        type: 'prescription_created',
        title: 'Prescription Issued',
        message: `A new prescription ${prescription.prescriptionNumber} has been issued for you`,
      },
    });

    res.status(201).json(prescription);
  } catch (error: any) {
    // Zod validation errors caught by central error handler if next() used, but here handle directly
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Validation failed', issues: error.issues });
    }
    console.error('Create prescription error:', error);
    res.status(500).json({ message: 'Failed to create prescription', error: error.message });
  }
};

// Get prescription by id (patient, provider, facility_admin, admin)
export const getPrescriptionById = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    const { id } = req.params;
    const prescription = await db.prescription.findUnique({ where: { id } });
    if (!prescription) return res.status(404).json({ message: 'Prescription not found' });
    if (!user) return res.status(401).json({ message: 'Unauthorized' });
    if (!(user.role === 'admin' || prescription.patientId === user.id || prescription.providerId === user.id || (user.role === 'facility_admin' && user.facilityId === prescription.facilityId))) {
      return res.status(403).json({ message: 'Access denied' });
    }
    res.json(prescription);
  } catch (error: any) {
    console.error('Get prescription error:', error);
    res.status(500).json({ message: 'Failed to fetch prescription', error: error.message });
  }
};

// List prescriptions (role-based filtering)
export const listPrescriptions = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: 'Unauthorized' });
  const where: any = {};
    if (user.role === 'patient') where.patientId = user.id;
    else if (user.role === 'healthcare_provider') where.providerId = user.id;
    else if (user.role === 'facility_admin' && user.facilityId) where.facilityId = user.facilityId;
    // admin sees all
    const prescriptions = await db.prescription.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    res.json(prescriptions);
  } catch (error: any) {
    console.error('List prescriptions error:', error);
    res.status(500).json({ message: 'Failed to list prescriptions', error: error.message });
  }
};

// Update prescription status (provider or facility_admin)
export const updatePrescriptionStatus = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    const { id } = req.params;
    const { status } = req.body; // fulfilled, cancelled, revoked
    if (!user || (user.role !== 'healthcare_provider' && user.role !== 'facility_admin' && user.role !== 'admin')) {
      return res.status(403).json({ message: 'Not authorized to update prescription status' });
    }
    const prescription = await db.prescription.findUnique({ where: { id } });
    if (!prescription) return res.status(404).json({ message: 'Prescription not found' });
    if (!(user.role === 'admin' || prescription.providerId === user.id || (user.role === 'facility_admin' && user.facilityId === prescription.facilityId))) {
      return res.status(403).json({ message: 'Access denied' });
    }
    const validStatuses = ['issued','fulfilled','cancelled','revoked'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const updated = await db.prescription.update({ where: { id }, data: { status } });
    await db.notification.create({
      data: {
        userId: prescription.patientId,
        prescriptionId: prescription.id,
        type: status === 'fulfilled' ? 'prescription_fulfilled' : 'prescription_cancelled',
        title: 'Prescription Update',
        message: `Prescription ${prescription.prescriptionNumber} status is now ${status}`,
      },
    });
    res.json(updated);
  } catch (error: any) {
    console.error('Update prescription status error:', error);
    res.status(500).json({ message: 'Failed to update prescription status', error: error.message });
  }
};
