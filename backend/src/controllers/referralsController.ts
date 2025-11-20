import { Request, Response } from 'express';
import prisma from '../database/db';
import { v4 as uuidv4 } from 'uuid';
import type { Referral, AuthRequest } from '../types';

export const getAllReferrals = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    const role = authReq.user?.role;

    let referrals: Referral[] = [] as any;

    if (role === 'patient') {
      referrals = await prisma.referral.findMany({
        where: { patientId: userId },
        orderBy: { createdAt: 'desc' },
      }) as any;
    } else if (role === 'healthcare_provider' || role === 'admin') {
      referrals = await prisma.referral.findMany({ orderBy: { createdAt: 'desc' } }) as any;
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

    const referral = await prisma.referral.findUnique({ where: { id } }) as any;

    if (!referral) {
      return res.status(404).json({ message: 'Referral not found' });
    }

    // Check access
    if (role === 'patient' && referral.patientId !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(referral);
  } catch (error: any) {
    console.error('Get referral error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createReferral = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const providerId = authReq.user?.id;
    const providerName = authReq.user?.email || 'Unknown';

    if (!providerId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const { patientId, reason, diagnosis, recommendations, referredToFacility, notes } = req.body;

    if (!patientId || !reason || !referredToFacility) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Get patient info
    const patient = await prisma.user.findUnique({ where: { id: patientId }, select: { id: true, name: true } });
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Get provider info
    const provider = await prisma.user.findUnique({ where: { id: providerId }, select: { name: true, facility: true } });
    const facilityName = provider?.facility || 'Unknown Facility';
    const referringFacility = facilityName;

    // Create referral
    const id = uuidv4();
    const createdAt = new Date().toISOString();

    const referral = await prisma.referral.create({
      data: {
        id,
        patientId,
        patientName: patient?.name || 'Unknown',
        providerId,
        providerName: provider?.name || providerName,
        facilityName,
        reason,
        diagnosis: diagnosis || null,
        recommendations: recommendations || null,
        referringFacility,
        referredToFacility,
        status: 'pending',
        createdAt: new Date(createdAt),
        notes: notes || null,
      },
    }) as any;

    res.status(201).json(referral);
  } catch (error: any) {
    console.error('Create referral error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateReferral = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const authReq = req as AuthRequest;
    const { status, notes } = req.body;

    const referral = await prisma.referral.findUnique({ where: { id } }) as any;
    if (!referral) {
      return res.status(404).json({ message: 'Referral not found' });
    }

    // Update referral
    const updated = await prisma.referral.update({
      where: { id },
      data: {
        ...(status ? { status } : {}),
        ...(notes !== undefined ? { notes } : {}),
      },
    }) as any;
    res.json(updated);
  } catch (error: any) {
    console.error('Update referral error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getReferralQR = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const referral = await prisma.referral.findUnique({ where: { id } });

    if (!referral) {
      return res.status(404).json({ message: 'Referral not found' });
    }

    // Generate QR code URL (in production, this would be a proper URL)
    const qrCodeUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/referrals/${id}`;
    
    res.json({ qrCode: qrCodeUrl });
  } catch (error: any) {
    console.error('Get QR code error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

