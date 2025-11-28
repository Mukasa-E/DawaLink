import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import type { AuthRequest } from '../types';

const prisma = new PrismaClient();

// Register a new healthcare facility
export const registerFacility = async (req: Request, res: Response) => {
  try {
    const {
      name,
      type,
      registrationNumber,
      phone,
      email,
      address,
      city,
      county,
      operatingHours,
      services,
      latitude,
      longitude
    } = req.body;

    const authReq = req as AuthRequest;
    const userId = authReq.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user already owns a facility
    const existingFacility = await (prisma as any).facility.findFirst({
      where: { ownerId: userId }
    });

    if (existingFacility) {
      return res.status(400).json({ error: 'User already owns a facility' });
    }

    // Check if registration number is unique
    const duplicateReg = await (prisma as any).facility.findUnique({
      where: { registrationNumber }
    });

    if (duplicateReg) {
      return res.status(400).json({ error: 'Registration number already exists' });
    }

    const facility = await (prisma as any).facility.create({
      data: {
        name,
        type,
        ownerId: userId,
        registrationNumber,
        phone,
        email,
        address,
        city,
        county,
        operatingHours,
        services: services || [],
        latitude,
        longitude,
        isVerified: false
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Update user role to facility_admin if they're not already
    await (prisma.user.update as any)({
      where: { id: userId },
      data: {
        role: 'facility_admin' as any,
        facilityId: facility.id
      }
    });

    res.status(201).json(facility);
  } catch (error) {
    console.error('Error registering facility:', error);
    res.status(500).json({ error: 'Failed to register facility' });
  }
};

// Get facility by ID
export const getFacility = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = prisma as any;

    const facility = await db.facility.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            specialization: true,
            licenseNumber: true
          }
        }
      }
    });

    if (!facility) {
      return res.status(404).json({ error: 'Facility not found' });
    }

    // Manually count related records for MongoDB
    const [usersCount, referralsToCount, referralsFromCount, recordsCount] = await Promise.all([
      db.user.count({ where: { facilityId: id } }),
      db.referral.count({ where: { receivingFacilityId: id } }),
      db.referral.count({ where: { referringFacilityId: id } }),
      db.medicalRecord.count({ where: { facilityId: id } })
    ]);

    // Add counts to facility object
    const facilityWithCounts = {
      ...facility,
      _count: {
        users: usersCount,
        referralsTo: referralsToCount,
        referralsFrom: referralsFromCount,
        records: recordsCount
      }
    };

    res.json(facilityWithCounts);
  } catch (error) {
    console.error('Error fetching facility:', error);
    res.status(500).json({ error: 'Failed to fetch facility' });
  }
};

// Get all facilities (with optional filters)
export const getFacilities = async (req: Request, res: Response) => {
  try {
    const { type, city, verified, search } = req.query;

    const where: any = {};

    if (type) {
      where.type = type;
    }

    if (city) {
      where.city = city;
    }

    if (verified !== undefined) {
      where.isVerified = verified === 'true';
    }

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { address: { contains: search as string, mode: 'insensitive' } },
        { city: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const facilities = await (prisma as any).facility.findMany({
      where,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            users: true,
            referralsFrom: true,
            referralsTo: true,
            records: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(facilities);
  } catch (error) {
    console.error('Error fetching facilities:', error);
    res.status(500).json({ error: 'Failed to fetch facilities' });
  }
};

// Update facility
export const updateFacility = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const authReq = req as AuthRequest;
    const userId = authReq.user?.userId;
    const userRole = authReq.user?.role;

    const facility = await (prisma as any).facility.findUnique({
      where: { id }
    });

    if (!facility) {
      return res.status(404).json({ error: 'Facility not found' });
    }

    // Check if user is owner or admin
    if (facility.ownerId !== userId && userRole !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to update this facility' });
    }

    const {
      name,
      phone,
      email,
      address,
      city,
      county,
      operatingHours,
      services,
      latitude,
      longitude
    } = req.body;

    const updated = await (prisma as any).facility.update({
      where: { id },
      data: {
        name,
        phone,
        email,
        address,
        city,
        county,
        operatingHours,
        services,
        latitude,
        longitude
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.json(updated);
  } catch (error) {
    console.error('Error updating facility:', error);
    res.status(500).json({ error: 'Failed to update facility' });
  }
};

// Verify facility (admin only)
export const verifyFacility = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isVerified } = req.body;

    const facility = await (prisma as any).facility.update({
      where: { id },
      data: { isVerified },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.json(facility);
  } catch (error) {
    console.error('Error verifying facility:', error);
    res.status(500).json({ error: 'Failed to verify facility' });
  }
};

// Get facility statistics
export const getFacilityStats = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const facility = await (prisma as any).facility.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            referralsFrom: true,
            referralsTo: true,
            records: true
          }
        }
      }
    });

    if (!facility) {
      return res.status(404).json({ error: 'Facility not found' });
    }

    // Get referral statistics
    const referralStats = await (prisma as any).referral.groupBy({
      by: ['status'],
      where: {
        OR: [
          { referringFacilityId: id },
          { receivingFacilityId: id }
        ]
      },
      _count: true
    });

    // Get recent activity
    const recentReferrals = await (prisma as any).referral.findMany({
      where: {
        OR: [
          { referringFacilityId: id },
          { receivingFacilityId: id }
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        referralNumber: true,
        patientName: true,
        status: true,
        urgencyLevel: true,
        createdAt: true
      }
    });

    const stats = {
      totalUsers: facility._count.users,
      totalReferralsSent: facility._count.referralsFrom,
      totalReferralsReceived: facility._count.referralsTo,
      totalRecords: facility._count.records,
      referralsByStatus: referralStats,
      recentReferrals
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching facility stats:', error);
    res.status(500).json({ error: 'Failed to fetch facility statistics' });
  }
};

// Add healthcare provider to facility
export const addProviderToFacility = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { email, name, phone, specialization, licenseNumber } = req.body;
    const authReq = req as AuthRequest;
    const userId = authReq.user?.userId;

    const facility = await (prisma as any).facility.findUnique({
      where: { id }
    });

    if (!facility) {
      return res.status(404).json({ error: 'Facility not found' });
    }

    // Check if requester is facility owner or admin
    if (facility.ownerId !== userId && authReq.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Check if user exists
    let provider = await prisma.user.findUnique({
      where: { email }
    });

    if (provider) {
      // Update existing user
      provider = await (prisma.user.update as any)({
        where: { id: provider.id },
        data: {
          facilityId: id,
          role: 'healthcare_provider' as any,
          specialization,
          licenseNumber
        }
      });
    } else {
      // Create new user (they'll need to set password on first login)
      const tempPassword = Math.random().toString(36).slice(-10);
      const passwordHash = await bcrypt.hash(tempPassword, 10);

      provider = await (prisma.user.create as any)({
        data: {
          email,
          name,
          phone,
          role: 'healthcare_provider',
          facilityId: id,
          specialization,
          licenseNumber,
          passwordHash
        }
      });

      // TODO: Send email with temporary password
    }

    res.status(201).json({
      provider: {
        id: provider!.id,
        name: provider!.name,
        email: provider!.email,
        role: provider!.role,
        specialization: (provider as any).specialization,
        licenseNumber: (provider as any).licenseNumber
      }
    });
  } catch (error) {
    console.error('Error adding provider:', error);
    res.status(500).json({ error: 'Failed to add provider' });
  }
};

// Remove provider from facility
export const removeProviderFromFacility = async (req: Request, res: Response) => {
  try {
    const { id, providerId } = req.params;
    const authReq = req as AuthRequest;
    const userId = authReq.user?.userId;

    const facility = await (prisma as any).facility.findUnique({
      where: { id }
    });

    if (!facility) {
      return res.status(404).json({ error: 'Facility not found' });
    }

    if (facility.ownerId !== userId && authReq.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await (prisma.user.update as any)({
      where: { id: providerId },
      data: {
        facilityId: null,
        role: 'patient' // Revert to patient role
      }
    });

    res.json({ message: 'Provider removed from facility' });
  } catch (error) {
    console.error('Error removing provider:', error);
    res.status(500).json({ error: 'Failed to remove provider' });
  }
};

// Get pending provider requests for a facility
export const getPendingProviders = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.userId;
    const userRole = authReq.user?.role;
    const facilityId = authReq.user?.facilityId;

    // Only facility_admin or admin can access
    if (userRole !== 'facility_admin' && userRole !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // For facility_admin, use their facilityId. For admin, allow filtering by facilityId from query
    let targetFacilityId = facilityId;
    if (userRole === 'admin' && req.query.facilityId) {
      targetFacilityId = req.query.facilityId as string;
    }

    if (!targetFacilityId) {
      return res.status(400).json({ error: 'Facility ID is required' });
    }

    const pendingProviders = await (prisma.user.findMany as any)({
      where: {
        facilityId: targetFacilityId,
        role: 'healthcare_provider',
        approvalStatus: 'pending'
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        specialization: true,
        licenseNumber: true,
        requestedAt: true,
        createdAt: true
      },
      orderBy: {
        requestedAt: 'desc'
      }
    });

    res.json(pendingProviders);
  } catch (error) {
    console.error('Error fetching pending providers:', error);
    res.status(500).json({ error: 'Failed to fetch pending providers' });
  }
};

// Approve provider request
export const approveProvider = async (req: Request, res: Response) => {
  try {
    const { providerId } = req.params;
    const authReq = req as AuthRequest;
    const userId = authReq.user?.userId;
    const userRole = authReq.user?.role;
    const facilityId = authReq.user?.facilityId;

    if (userRole !== 'facility_admin' && userRole !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Get the provider to check their facilityId
    const provider = await prisma.user.findUnique({
      where: { id: providerId }
    });

    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }

    // Facility admin can only approve providers for their facility
    if (userRole === 'facility_admin' && (provider as any).facilityId !== facilityId) {
      return res.status(403).json({ error: 'Not authorized to approve this provider' });
    }

    const updatedProvider = await (prisma.user.update as any)({
      where: { id: providerId },
      data: {
        isApproved: true,
        approvalStatus: 'approved',
        approvedAt: new Date(),
        approvedBy: userId
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        specialization: true,
        licenseNumber: true,
        approvalStatus: true,
        approvedAt: true
      }
    });

    res.json({
      message: 'Provider approved successfully',
      provider: updatedProvider
    });
  } catch (error) {
    console.error('Error approving provider:', error);
    res.status(500).json({ error: 'Failed to approve provider' });
  }
};

// Reject provider request
export const rejectProvider = async (req: Request, res: Response) => {
  try {
    const { providerId } = req.params;
    const { reason } = req.body;
    const authReq = req as AuthRequest;
    const userId = authReq.user?.userId;
    const userRole = authReq.user?.role;
    const facilityId = authReq.user?.facilityId;

    if (userRole !== 'facility_admin' && userRole !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Get the provider to check their facilityId
    const provider = await prisma.user.findUnique({
      where: { id: providerId }
    });

    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }

    // Facility admin can only reject providers for their facility
    if (userRole === 'facility_admin' && (provider as any).facilityId !== facilityId) {
      return res.status(403).json({ error: 'Not authorized to reject this provider' });
    }

    const updatedProvider = await (prisma.user.update as any)({
      where: { id: providerId },
      data: {
        isApproved: false,
        approvalStatus: 'rejected',
        rejectionReason: reason || 'No reason provided',
        facilityId: null // Remove facility association
      },
      select: {
        id: true,
        name: true,
        email: true,
        approvalStatus: true,
        rejectionReason: true
      }
    });

    res.json({
      message: 'Provider request rejected',
      provider: updatedProvider
    });
  } catch (error) {
    console.error('Error rejecting provider:', error);
    res.status(500).json({ error: 'Failed to reject provider' });
  }
};
