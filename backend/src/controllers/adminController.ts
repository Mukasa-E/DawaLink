import { Request, Response } from 'express';
import prisma from '../database/db';
import type { AuthRequest } from '../types';

export const getStats = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const role = authReq.user?.role;

    if (role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const [totalUsers, totalReferrals, totalRecords, facilities] = await Promise.all([
      prisma.user.count(),
      prisma.referral.count(),
      prisma.medicalRecord.count(),
      prisma.facility.count(),
    ]);

    res.json({
      totalUsers,
      totalReferrals,
      totalRecords,
      activeFacilities: facilities,
    });
  } catch (error: any) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const role = authReq.user?.role;

    if (role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true, role: true, phone: true, facility: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });

    res.json(users);
  } catch (error: any) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// CSV export for referrals
export const exportReferralsCSV = async (req: Request, res: Response) => {
  try {
    const authReq = req as any;
    if (authReq.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const referrals = await prisma.referral.findMany({ orderBy: { createdAt: 'desc' } as any });

    // Build CSV
    const header = ['id', 'patientId', 'patientName', 'providerId', 'providerName', 'facilityName', 'reason', 'status', 'createdAt'];
    const rows = referrals.map((r: any) => [r.id, r.patientId, r.patientName, r.providerId, r.providerName, r.facilityName, (r.reason || '').replace(/\n/g, ' '), r.status, r.createdAt.toISOString()]);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="referrals.csv"');

    res.write(header.join(',') + '\n');
    for (const row of rows) {
      res.write(row.map((c: any) => `"${String(c).replace(/"/g, '""')}"`).join(',') + '\n');
    }
    res.end();
  } catch (error: any) {
    console.error('Export referrals error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// CSV export for records
export const exportRecordsCSV = async (req: Request, res: Response) => {
  try {
    const authReq = req as any;
    if (authReq.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

  const records = await prisma.medicalRecord.findMany({ orderBy: { visitDate: 'desc' } });

  const header = ['id', 'patientId', 'providerId', 'providerName', 'facilityName', 'recordType', 'title', 'visitDate'];
  const rows = records.map((r: any) => [r.id, r.patientId, r.providerId, r.providerName, r.facilityName, r.recordType, (r.title || '').replace(/\n/g, ' '), r.visitDate.toISOString()]);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="records.csv"');

    res.write(header.join(',') + '\n');
    for (const row of rows) {
      res.write(row.map((c: any) => `"${String(c).replace(/"/g, '""')}"`).join(',') + '\n');
    }
    res.end();
  } catch (error: any) {
    console.error('Export records error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get all facilities (including pending approval)
export const getAllFacilities = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const role = authReq.user?.role;

    if (role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const facilities = await prisma.facility.findMany({
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(facilities);
  } catch (error: any) {
    console.error('Get facilities error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Approve a facility
export const approveFacility = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const role = authReq.user?.role;

    if (role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { id } = req.params;

    const facility = await prisma.facility.update({
      where: { id },
      data: { isVerified: true },
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

    res.json({ message: 'Facility approved successfully', facility });
  } catch (error: any) {
    console.error('Approve facility error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Reject/Revoke facility approval
export const rejectFacility = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const role = authReq.user?.role;

    if (role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { id } = req.params;

    const facility = await prisma.facility.update({
      where: { id },
      data: { isVerified: false },
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

    res.json({ message: 'Facility verification revoked', facility });
  } catch (error: any) {
    console.error('Reject facility error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
