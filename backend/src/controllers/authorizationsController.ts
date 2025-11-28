import { Request, Response } from 'express';
import prisma from '../database/db';
import type { AuthRequest } from '../types';

// Type assertion helper for Prisma client cache issues
const db = prisma as any;

// Grant authorization to a provider or facility
export const grantAuthorization = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const patientId = authReq.user?.id;
    const role = authReq.user?.role;

    if (role !== 'patient') {
      return res.status(403).json({ message: 'Only patients can grant authorizations' });
    }

    const { providerId, facilityId, accessLevel, purpose, expiresAt } = req.body;

    if (!providerId && !facilityId) {
      return res.status(400).json({ message: 'Either providerId or facilityId is required' });
    }

    if (providerId && facilityId) {
      return res.status(400).json({ message: 'Specify either provider or facility, not both' });
    }

    // Check if authorization already exists
    const existing = await db.patientAuthorization.findFirst({
      where: {
        patientId: patientId!,
        ...(providerId ? { providerId } : {}),
        ...(facilityId ? { facilityId } : {}),
        isActive: true
      }
    });

    if (existing) {
      return res.status(400).json({ message: 'Authorization already exists' });
    }

    // Verify provider or facility exists
    if (providerId) {
      const provider = await db.user.findUnique({
        where: { id: providerId },
        select: { role: true }
      });

      if (!provider || (provider.role !== 'healthcare_provider' && provider.role !== 'facility_admin')) {
        return res.status(404).json({ message: 'Provider not found' });
      }
    }

    if (facilityId) {
      const facility = await db.facility.findUnique({
        where: { id: facilityId }
      });

      if (!facility) {
        return res.status(404).json({ message: 'Facility not found' });
      }
    }

    // Create authorization
    const authorization = await db.patientAuthorization.create({
      data: {
        patientId: patientId!,
        providerId: providerId || null,
        facilityId: facilityId || null,
        accessLevel: accessLevel || 'view_only',
        purpose,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        isActive: true
      },
      include: {
        provider: providerId ? {
          select: {
            id: true,
            name: true,
            email: true,
            specialization: true
          }
        } : undefined
      }
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        userId: patientId,
        userEmail: authReq.user?.email,
        userRole: role,
        action: 'grant_access',
        resourceType: 'authorization',
        resourceId: authorization.id,
        detail: {
          providerId,
          facilityId,
          accessLevel,
          purpose
        }
      }
    });

    // TODO: Send notification to provider/facility

    res.status(201).json(authorization);
  } catch (error: any) {
    console.error('Grant authorization error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Revoke authorization
export const revokeAuthorization = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    const role = authReq.user?.role;

    const authorization = await db.patientAuthorization.findUnique({
      where: { id }
    });

    if (!authorization) {
      return res.status(404).json({ message: 'Authorization not found' });
    }

    // Only patient or admin can revoke
    if (role !== 'admin' && authorization.patientId !== userId) {
      return res.status(403).json({ message: 'Not authorized to revoke this authorization' });
    }

    const updated = await db.patientAuthorization.update({
      where: { id },
      data: {
        isActive: false,
        revokedAt: new Date()
      },
      include: {
        provider: authorization.providerId ? {
          select: {
            id: true,
            name: true,
            email: true
          }
        } : undefined
      }
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        userId,
        userEmail: authReq.user?.email,
        userRole: role,
        action: 'revoke_access',
        resourceType: 'authorization',
        resourceId: id,
        detail: {
          providerId: authorization.providerId,
          facilityId: authorization.facilityId
        }
      }
    });

    res.json(updated);
  } catch (error: any) {
    console.error('Revoke authorization error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get all authorizations for a patient
export const getPatientAuthorizations = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    const role = authReq.user?.role;
    const { patientId } = req.query;

    let queryPatientId = userId;

    if (role === 'admin' && patientId) {
      queryPatientId = patientId as string;
    } else if (role !== 'patient') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const authorizations = await db.patientAuthorization.findMany({
      where: {
        patientId: queryPatientId,
        isActive: true
      },
      include: {
        provider: {
          select: {
            id: true,
            name: true,
            email: true,
            specialization: true,
            facility: {
              select: {
                name: true,
                type: true
              }
            }
          }
        }
      },
      orderBy: {
        grantedAt: 'desc'
      }
    });

    res.json(authorizations);
  } catch (error: any) {
    console.error('Get authorizations error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get all patients a provider has access to
export const getProviderAuthorizations = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    const role = authReq.user?.role;
    const facilityId = authReq.user?.facilityId;

    if (role !== 'healthcare_provider' && role !== 'facility_admin' && role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const where: any = {
      isActive: true
    };

    if (role === 'healthcare_provider') {
      where.OR = [
        { providerId: userId },
        { facilityId }
      ];
    } else if (role === 'facility_admin') {
      where.facilityId = facilityId;
    }

    const authorizations = await db.patientAuthorization.findMany({
      where,
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        }
      },
      orderBy: {
        grantedAt: 'desc'
      }
    });

    res.json(authorizations);
  } catch (error: any) {
    console.error('Get provider authorizations error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Check if provider has access to patient
export const checkAuthorization = async (req: Request, res: Response) => {
  try {
    const { patientId, providerId, facilityId } = req.query;

    if (!patientId || (!providerId && !facilityId)) {
      return res.status(400).json({ message: 'Missing required parameters' });
    }

    const authorization = await db.patientAuthorization.findFirst({
      where: {
        patientId: patientId as string,
        ...(providerId ? { providerId: providerId as string } : {}),
        ...(facilityId ? { facilityId: facilityId as string } : {}),
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      }
    });

    res.json({
      hasAccess: !!authorization,
      authorization: authorization || null
    });
  } catch (error: any) {
    console.error('Check authorization error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

