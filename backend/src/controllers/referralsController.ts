import { Request, Response, NextFunction } from 'express';
import prisma from '../database/db';
import { v4 as uuidv4 } from 'uuid';
import type { AuthRequest } from '../types';
import * as crypto from 'crypto';
import { ReferralCreateSchema } from '../middleware/validation';

// Type assertion helper for Prisma client cache issues
const db = prisma as any;

// Generate a unique referral number
const generateReferralNumber = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `REF-${timestamp}-${random}`;
};

// Generate QR code data (encrypted)
const generateQRCode = (referralId: string, patientId: string) => {
  const data = JSON.stringify({
    referralId,
    patientId,
    timestamp: Date.now()
  });
  // In production, encrypt this data
  const qrCode = Buffer.from(data).toString('base64');
  return qrCode;
};

export const getAllReferrals = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    const role = authReq.user?.role;
    const facilityId = authReq.user?.facilityId;

    let referrals: any[] = [];

    if (role === 'patient') {
      // Patients see their own referrals
      referrals = await db.referral.findMany({
        where: { patientId: userId },
        include: {
          provider: {
            select: {
              id: true,
              name: true,
              email: true,
              specialization: true
            }
          },
          referringFacility: {
            select: {
              id: true,
              name: true,
              type: true,
              address: true,
              city: true
            }
          },
          receivingFacility: {
            select: {
              id: true,
              name: true,
              type: true,
              address: true,
              city: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
      });
    } else if (role === 'healthcare_provider' && facilityId) {
      // Providers see referrals from their facility or to their facility
      referrals = await db.referral.findMany({
        where: {
          OR: [
            { referringFacilityId: facilityId },
            { receivingFacilityId: facilityId }
          ]
        },
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
          referringFacility: {
            select: {
              name: true,
              type: true,
              city: true
            }
          },
          receivingFacility: {
            select: {
              name: true,
              type: true,
              city: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    } else if (role === 'facility_admin' && facilityId) {
      // Facility admins see all referrals for their facility
      referrals = await db.referral.findMany({
        where: {
          OR: [
            { referringFacilityId: facilityId },
            { receivingFacilityId: facilityId }
          ]
        },
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
          referringFacility: {
            select: {
              name: true,
              type: true
            }
          },
          receivingFacility: {
            select: {
              name: true,
              type: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    } else if (role === 'admin') {
      // System admins see all referrals
      referrals = await db.referral.findMany({
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
          referringFacility: {
            select: {
              name: true,
              type: true
            }
          },
          receivingFacility: {
            select: {
              name: true,
              type: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    } else {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(referrals);
  } catch (error: any) {
    console.error('Get referrals error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getReferralById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    const role = authReq.user?.role;
    const facilityId = authReq.user?.facilityId;

    const referral = await db.referral.findUnique({
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
        referringFacility: {
          select: {
            id: true,
            name: true,
            type: true,
            address: true,
            city: true,
            phone: true,
            email: true
          }
        },
        receivingFacility: {
          select: {
            id: true,
            name: true,
            type: true,
            address: true,
            city: true,
            phone: true,
            email: true
          }
        }
      }
    });

    if (!referral) {
      return res.status(404).json({ message: 'Referral not found' });
    }

    // Check access permissions
    const hasAccess = 
      role === 'admin' ||
      (role === 'patient' && referral.patientId === userId) ||
      ((role === 'healthcare_provider' || role === 'facility_admin') && 
       (referral.referringFacilityId === facilityId || referral.receivingFacilityId === facilityId));

    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(referral);
  } catch (error: any) {
    console.error('Get referral error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createReferral = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const providerId = authReq.user?.id;
    const userFacilityId = authReq.user?.facilityId;

    if (!providerId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const {
      patientId,
      patientAge,
      patientGender,
      referringFacilityId,
      receivingFacilityId,
      receivingProviderId,
      reason,
      clinicalSummary,
      diagnosis,
      vitalSigns,
      testResults,
      treatmentGiven,
      recommendations,
      urgencyLevel
    } = ReferralCreateSchema.parse(req.body);

    // Use provided referringFacilityId, or fall back to user's facilityId
    const actualReferringFacilityId = referringFacilityId || userFacilityId;

    if (!actualReferringFacilityId) {
      return res.status(400).json({ 
        message: 'Please specify which facility you are referring from' 
      });
    }

    // Get patient info
    const patient = await db.user.findUnique({
      where: { id: patientId },
      select: { id: true, name: true }
    });

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Get provider info
    const provider = await db.user.findUnique({
      where: { id: providerId },
      select: { name: true, specialization: true }
    });

    // Get facility info
    const facility = await db.facility.findUnique({
      where: { id: actualReferringFacilityId }
    });

    if (!facility) {
      return res.status(404).json({ message: 'Referring facility not found' });
    }

    // Generate referral number and ID
    const referralNumber = generateReferralNumber();
    const id = uuidv4();

    // Generate QR code
    const qrCode = generateQRCode(id, patientId);

    // Calculate expiry (30 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Prepare referral data
    const referralData: any = {
      id,
      referralNumber,
      qrCode,
      patientId,
      patientName: patient.name,
      patientAge,
      patientGender,
      providerId,
      providerName: provider?.name || 'Unknown',
      providerSpecialization: provider?.specialization,
      referringFacilityId: actualReferringFacilityId,
      receivingFacilityId: receivingFacilityId || null,
      reason,
      clinicalSummary,
      diagnosis,
      vitalSigns,
      testResults,
      treatmentGiven,
      recommendations,
      urgencyLevel: urgencyLevel || 'routine',
      status: 'pending',
      expiresAt
    };

    // Only add receivingProviderId if the field exists in schema
    if (receivingProviderId) {
      referralData.receivingProviderId = receivingProviderId;
    }

    // Create referral
    const referral = await db.referral.create({
      data: referralData,
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
        referringFacility: {
          select: {
            name: true,
            type: true,
            address: true,
            city: true
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
        action: 'create_referral',
        resourceType: 'referral',
        resourceId: id,
        facilityId: actualReferringFacilityId,
        detail: {
          referralNumber,
          patientId,
          urgencyLevel
        }
      }
    });

    // TODO: Send notification to patient
    // TODO: If receivingFacility specified, notify them

    res.status(201).json(referral);
  } catch (error: any) {
    next(error);
  }
};

export const updateReferral = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    const facilityId = authReq.user?.facilityId;
    const { status, receivedBy, completionNotes, receivingFacilityId } = req.body;

    const referral = await db.referral.findUnique({ where: { id } });

    if (!referral) {
      return res.status(404).json({ message: 'Referral not found' });
    }

    // Check if user has permission to update
    const canUpdate = 
      authReq.user?.role === 'admin' ||
      referral.providerId === userId ||
      referral.referringFacilityId === facilityId ||
      referral.receivingFacilityId === facilityId;

    if (!canUpdate) {
      return res.status(403).json({ message: 'Not authorized to update this referral' });
    }

    const updateData: any = {};

    if (status) {
      updateData.status = status;
      if (status === 'accepted' || status === 'in_progress') {
        updateData.receivedAt = new Date();
      }
    }

    if (receivedBy) updateData.receivedBy = receivedBy;
    if (completionNotes) updateData.completionNotes = completionNotes;
    if (receivingFacilityId) updateData.receivingFacilityId = receivingFacilityId;

    const updated = await db.referral.update({
      where: { id },
      data: updateData,
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
        referringFacility: {
          select: {
            name: true,
            type: true
          }
        },
        receivingFacility: {
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
        action: 'update_referral',
        resourceType: 'referral',
        resourceId: id,
        facilityId,
        detail: {
          status,
          changes: updateData
        }
      }
    });

    res.json(updated);
  } catch (error: any) {
    console.error('Update referral error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getReferralQR = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;

    const referral = await db.referral.findUnique({
      where: { id },
      select: {
        id: true,
        referralNumber: true,
        qrCode: true,
        patientId: true,
        status: true,
        expiresAt: true
      }
    });

    if (!referral) {
      return res.status(404).json({ message: 'Referral not found' });
    }

    // Check if user has access (patient or provider)
    if (authReq.user?.role === 'patient' && referral.patientId !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if referral is expired
    if (referral.expiresAt && new Date(referral.expiresAt) < new Date()) {
      return res.status(410).json({ message: 'Referral has expired' });
    }

    res.json({
      referralNumber: referral.referralNumber,
      qrCode: referral.qrCode,
      status: referral.status,
      expiresAt: referral.expiresAt
    });
  } catch (error: any) {
    console.error('Get QR code error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Verify referral by QR code
export const verifyReferralByQR = async (req: Request, res: Response) => {
  try {
    const { qrCode } = req.body;

    if (!qrCode) {
      return res.status(400).json({ message: 'QR code required' });
    }

    // Decode QR code
    const decoded = Buffer.from(qrCode, 'base64').toString('utf-8');
    const { referralId, patientId } = JSON.parse(decoded);

    const referral = await db.referral.findUnique({
      where: { id: referralId },
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
        referringFacility: {
          select: {
            name: true,
            type: true,
            address: true,
            city: true
          }
        }
      }
    });

    if (!referral) {
      return res.status(404).json({ message: 'Invalid QR code' });
    }

    if (referral.patientId !== patientId) {
      return res.status(403).json({ message: 'QR code mismatch' });
    }

    // Check expiry
    if (referral.expiresAt && new Date(referral.expiresAt) < new Date()) {
      return res.status(410).json({ message: 'Referral expired' });
    }

    res.json({
      valid: true,
      referral
    });
  } catch (error: any) {
    console.error('Verify QR error:', error);
    res.status(400).json({ message: 'Invalid QR code format' });
  }
};


