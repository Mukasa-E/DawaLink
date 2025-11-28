import { Request, Response, NextFunction } from 'express';
import prisma from '../database/db';
import { v4 as uuidv4 } from 'uuid';
import type { AuthRequest } from '../types';
import { MedicalRecordCreateSchema } from '../middleware/validation';

// Type assertion helper for Prisma client cache issues
const db = prisma as any;

// Generate a unique record number
const generateRecordNumber = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `REC-${timestamp}-${random}`;
};

// Generate QR code data for record
const generateQRCode = (recordId: string, patientId: string) => {
  const data = JSON.stringify({
    recordId,
    patientId,
    timestamp: Date.now()
  });
  return Buffer.from(data).toString('base64');
};

export const getAllRecords = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    const role = authReq.user?.role;
    const facilityId = authReq.user?.facilityId;
    const { patientId } = req.query;

    let records: any[] = [];

    if (role === 'patient') {
      // Patients see their own records
      records = await db.medicalRecord.findMany({
        where: { patientId: userId },
        include: {
          provider: {
            select: {
              id: true,
              name: true,
              specialization: true
            }
          },
          facility: {
            select: {
              id: true,
              name: true,
              type: true,
              city: true
            }
          }
        },
        orderBy: { visitDate: 'desc' },
      });
    } else if ((role === 'healthcare_provider' || role === 'facility_admin') && facilityId) {
      // Providers see records from their facility or authorized records
      const where: any = {};

      if (patientId && typeof patientId === 'string') {
        // Check if provider has authorization for this patient
        const hasAuth = await db.patientAuthorization.findFirst({
          where: {
            patientId: patientId as string,
            OR: [
              { providerId: userId },
              { facilityId }
            ],
            isActive: true
          }
        });

        if (!hasAuth && role !== 'facility_admin') {
          return res.status(403).json({ message: 'No authorization to view this patient\'s records' });
        }

        where.patientId = patientId;
      } else {
        // Get all records from their facility
        where.facilityId = facilityId;
      }

      records = await db.medicalRecord.findMany({
        where,
        include: {
          patient: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          },
          provider: {
            select: {
              id: true,
              name: true,
              specialization: true
            }
          },
          facility: {
            select: {
              name: true,
              type: true
            }
          }
        },
        orderBy: { visitDate: 'desc' },
      });
    } else if (role === 'admin') {
      // System admins see all records
      const where: any = {};
      if (patientId) {
        where.patientId = patientId;
      }

      records = await db.medicalRecord.findMany({
        where,
        include: {
          patient: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          provider: {
            select: {
              id: true,
              name: true,
              specialization: true
            }
          },
          facility: {
            select: {
              name: true,
              type: true,
              city: true
            }
          }
        },
        orderBy: { visitDate: 'desc' },
      });
    } else {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(records);
  } catch (error: any) {
    console.error('Get records error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getRecordById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    const role = authReq.user?.role;
    const facilityId = authReq.user?.facilityId;

    const record = await db.medicalRecord.findUnique({
      where: { id },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        provider: {
          select: {
            id: true,
            name: true,
            email: true,
            specialization: true,
            licenseNumber: true
          }
        },
        facility: {
          select: {
            id: true,
            name: true,
            type: true,
            address: true,
            city: true,
            phone: true
          }
        }
      }
    });

    if (!record) {
      return res.status(404).json({ message: 'Record not found' });
    }

    // Check access permissions
    let hasAccess = false;

    if (role === 'admin') {
      hasAccess = true;
    } else if (role === 'patient' && record.patientId === userId) {
      hasAccess = true;
    } else if ((role === 'healthcare_provider' || role === 'facility_admin')) {
      // Check if from same facility or has authorization
      if (record.facilityId === facilityId) {
        hasAccess = true;
      } else {
        const auth = await db.patientAuthorization.findFirst({
          where: {
            patientId: record.patientId,
            OR: [
              { providerId: userId },
              { facilityId }
            ],
            isActive: true
          }
        });
        hasAccess = !!auth;
      }
    }

    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Create audit log
    await db.auditLog.create({
      data: {
        userId,
        userEmail: authReq.user?.email,
        userRole: role,
        action: 'view_record',
        resourceType: 'medical_record',
        resourceId: id,
        facilityId,
        detail: {
          patientId: record.patientId,
          recordType: record.recordType
        }
      }
    });

    res.json(record);
  } catch (error: any) {
    console.error('Get record error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createRecord = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const providerId = authReq.user?.id;
    const facilityId = authReq.user?.facilityId;

    if (!providerId || !facilityId) {
      return res.status(401).json({ message: 'Not authenticated or no facility assigned' });
    }

    const {
      patientId,
      recordType,
      title,
      description,
      diagnosis,
      treatment,
      medications,
      vitalSigns,
      labResults,
      attachments,
      visitDate,
      isConfidential,
      shareableViaQR
    } = MedicalRecordCreateSchema.parse(req.body);

    // Get provider and facility info
    const provider = await db.user.findUnique({
      where: { id: providerId },
      select: { name: true }
    });

    const facility = await db.facility.findUnique({
      where: { id: facilityId },
      select: { name: true }
    });

    if (!facility) {
      return res.status(404).json({ message: 'Facility not found' });
    }

    // Generate record number
    const recordNumber = generateRecordNumber();
    const id = uuidv4();

    // Generate QR code if shareable
    const qrCode = shareableViaQR ? generateQRCode(id, patientId) : null;

    // Create record
    const record = await db.medicalRecord.create({
      data: {
        id,
        recordNumber,
        patientId,
        providerId,
        providerName: provider?.name || 'Unknown Provider',
        facilityId,
        facilityName: facility.name,
        recordType,
        title,
        description,
        diagnosis,
        treatment,
        medications,
        vitalSigns,
        labResults,
        attachments,
        visitDate: visitDate ? new Date(visitDate) : new Date(),
        isConfidential: isConfidential || false,
        shareableViaQR: shareableViaQR || false,
        qrCode
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        provider: {
          select: {
            id: true,
            name: true,
            specialization: true
          }
        },
        facility: {
          select: {
            name: true,
            type: true
          }
        }
      }
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        userId: providerId,
        userEmail: authReq.user?.email,
        userRole: authReq.user?.role,
        action: 'create_record',
        resourceType: 'medical_record',
        resourceId: id,
        facilityId,
        detail: {
          patientId,
          recordType,
          recordNumber
        }
      }
    });

    res.status(201).json(record);
  } catch (error: any) {
    next(error);
  }
};

export const updateRecord = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    const facilityId = authReq.user?.facilityId;

    const {
      title,
      description,
      diagnosis,
      treatment,
      medications,
      vitalSigns,
      labResults,
      attachments,
      isConfidential,
      shareableViaQR
    } = req.body;

    const record = await db.medicalRecord.findUnique({ where: { id } });

    if (!record) {
      return res.status(404).json({ message: 'Record not found' });
    }

    // Check if user can update (provider who created it or facility admin)
    const canUpdate = 
      authReq.user?.role === 'admin' ||
      (record.providerId === userId) ||
      (authReq.user?.role === 'facility_admin' && record.facilityId === facilityId);

    if (!canUpdate) {
      return res.status(403).json({ message: 'Not authorized to update this record' });
    }

    const updateData: any = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (diagnosis) updateData.diagnosis = diagnosis;
    if (treatment) updateData.treatment = treatment;
    if (medications) updateData.medications = medications;
    if (vitalSigns) updateData.vitalSigns = vitalSigns;
    if (labResults) updateData.labResults = labResults;
    if (attachments) updateData.attachments = attachments;
    if (isConfidential !== undefined) updateData.isConfidential = isConfidential;
    if (shareableViaQR !== undefined) {
      updateData.shareableViaQR = shareableViaQR;
      // Generate or remove QR code
      if (shareableViaQR && !record.qrCode) {
        updateData.qrCode = generateQRCode(id, record.patientId);
      } else if (!shareableViaQR) {
        updateData.qrCode = null;
      }
    }

    const updated = await db.medicalRecord.update({
      where: { id },
      data: updateData,
      include: {
        patient: {
          select: {
            id: true,
            name: true
          }
        },
        provider: {
          select: {
            id: true,
            name: true,
            specialization: true
          }
        },
        facility: {
          select: {
            name: true,
            type: true
          }
        }
      }
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        userId,
        userEmail: authReq.user?.email,
        userRole: authReq.user?.role,
        action: 'update_record',
        resourceType: 'medical_record',
        resourceId: id,
        facilityId,
        detail: {
          changes: Object.keys(updateData)
        }
      }
    });

    res.json(updated);
  } catch (error: any) {
    console.error('Update record error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get record by QR code
export const getRecordByQR = async (req: Request, res: Response) => {
  try {
    const { qrCode } = req.body;
    const authReq = req as AuthRequest;

    if (!qrCode) {
      return res.status(400).json({ message: 'QR code required' });
    }

    // Decode QR code
    const decoded = Buffer.from(qrCode, 'base64').toString('utf-8');
    const { recordId, patientId } = JSON.parse(decoded);

    const record = await db.medicalRecord.findUnique({
      where: { id: recordId },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        },
        provider: {
          select: {
            name: true,
            specialization: true
          }
        },
        facility: {
          select: {
            name: true,
            type: true,
            address: true,
            city: true
          }
        }
      }
    });

    if (!record) {
      return res.status(404).json({ message: 'Invalid QR code' });
    }

    if (record.patientId !== patientId) {
      return res.status(403).json({ message: 'QR code mismatch' });
    }

    if (!record.shareableViaQR) {
      return res.status(403).json({ message: 'Record not shareable via QR code' });
    }

    // Create audit log for QR access
    await db.auditLog.create({
      data: {
        userId: authReq.user?.id,
        userEmail: authReq.user?.email,
        userRole: authReq.user?.role,
        action: 'view_record_qr',
        resourceType: 'medical_record',
        resourceId: recordId,
        detail: {
          patientId,
          accessMethod: 'qr_code'
        }
      }
    });

    res.json({
      valid: true,
      record
    });
  } catch (error: any) {
    console.error('Get record by QR error:', error);
    res.status(400).json({ message: 'Invalid QR code format' });
  }
};


