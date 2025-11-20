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
      prisma.user.count({ where: { facility: { not: null } } }),
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

    const records = await prisma.medicalRecord.findMany({ orderBy: { date: 'desc' } as any });

    const header = ['id', 'patientId', 'providerId', 'providerName', 'facilityName', 'recordType', 'title', 'date'];
    const rows = records.map((r: any) => [r.id, r.patientId, r.providerId, r.providerName, r.facilityName, r.recordType, (r.title || '').replace(/\n/g, ' '), r.date.toISOString()]);

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

