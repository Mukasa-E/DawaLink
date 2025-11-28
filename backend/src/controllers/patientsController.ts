import { Request, Response } from 'express';
import prisma from '../database/db';
import { v4 as uuidv4 } from 'uuid';
import type { AuthRequest, User } from '../types';

export const searchPatients = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const role = authReq.user?.role;
    const userId = authReq.user?.id;

    if (role !== 'healthcare_provider' && role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { q } = req.query;
    if (!q || typeof q !== 'string') {
      return res.status(400).json({ message: 'Search query is required' });
    }

    // Get current user's facility
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { facilityId: true },
    });

    // Build the where clause
    const whereClause: any = {
      role: 'patient',
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q, mode: 'insensitive' } },
      ],
    };

    // Filter by preferred facility if the provider has a facility
    // If provider has facilityId we could later filter by patients linked to that facility.

    const searchTerm = `%${q}%`;
    const patients = await prisma.user.findMany({
      where: whereClause,
      select: { 
        id: true, 
        email: true, 
        name: true, 
        role: true, 
        phone: true, 
        facilityId: true,
        createdAt: true 
      },
      take: 20,
    });

    res.json(patients);
  } catch (error: any) {
    console.error('Search patients error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getPatientById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const authReq = req as AuthRequest;
    const role = authReq.user?.role;

    if (role !== 'healthcare_provider' && role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const patient = await prisma.user.findFirst({
      where: { id, role: 'patient' },
      select: { 
        id: true, 
        email: true, 
        name: true, 
        role: true, 
        phone: true, 
        facilityId: true,
        createdAt: true 
      },
    });

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    res.json(patient);
  } catch (error: any) {
    console.error('Get patient error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const authorizeAccess = async (req: Request, res: Response) => {
  try {
    const { id: patientId } = req.params;
    const authReq = req as AuthRequest;
    const providerId = authReq.user?.id;
    const role = authReq.user?.role;

    if (role !== 'healthcare_provider' && role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (!providerId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Check if patient exists
    const patient = await prisma.user.findFirst({ where: { id: patientId, role: 'patient' } });
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Check if authorization already exists
    const existing = await prisma.patientAuthorization.findFirst({
      where: { patientId, providerId },
    });
    
    if (!existing) {
      await prisma.patientAuthorization.create({
        data: { patientId, providerId },
      });
    }

    res.json({ message: 'Access authorized successfully' });
  } catch (error: any) {
    console.error('Authorize access error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const revokeAccess = async (req: Request, res: Response) => {
  try {
    const { id: patientId } = req.params;
    const { providerId } = req.body;
    const authReq = req as AuthRequest;
    const role = authReq.user?.role;

    if (role !== 'healthcare_provider' && role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (!providerId) {
      return res.status(400).json({ message: 'Provider ID is required' });
    }

    await prisma.patientAuthorization.deleteMany({
      where: { patientId, providerId },
    });

    res.json({ message: 'Access revoked successfully' });
  } catch (error: any) {
    console.error('Revoke access error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get patients the provider has treated via referrals
export const getMyPatients = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    const role = authReq.user?.role;
    const facilityId = authReq.user?.facilityId;

    if (role !== 'healthcare_provider' && role !== 'facility_admin' && role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // If admin, return all patients with their referral stats
    if (role === 'admin') {
      const allPatients = await (prisma as any).user.findMany({
        where: { role: 'patient' },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' }
      });

      // Get referral stats for each patient
      const patientsWithStats = await Promise.all(
        allPatients.map(async (patient: any) => {
          const referrals = await (prisma as any).referral.findMany({
            where: { patientId: patient.id },
            include: {
              referringFacility: { select: { id: true, name: true } },
              receivingFacility: { select: { id: true, name: true } }
            },
            orderBy: { createdAt: 'desc' }
          });

          return {
            ...patient,
            referralCount: referrals.length,
            referredOut: referrals.filter((r: any) => r.referringFacilityId).length,
            referredIn: referrals.filter((r: any) => r.receivingFacilityId).length,
            lastReferralDate: referrals.length > 0 ? referrals[0].createdAt : patient.createdAt,
            referrals: referrals.slice(0, 5).map((r: any) => ({
              id: r.id,
              referralNumber: r.referralNumber,
              date: r.createdAt,
              status: r.status,
              type: 'outgoing',
              fromFacility: r.referringFacility?.name,
              toFacility: r.receivingFacility?.name,
              urgencyLevel: r.urgencyLevel
            }))
          };
        })
      );

      return res.json(patientsWithStats);
    }

    if (!facilityId) {
      return res.status(400).json({ message: 'No facility assigned' });
    }

    // Get all referrals involving the provider's facility
    const referrals = await (prisma as any).referral.findMany({
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
            phone: true,
            createdAt: true
          }
        },
        referringFacility: {
          select: {
            id: true,
            name: true
          }
        },
        receivingFacility: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Extract unique patients with referral context
    const patientsMap = new Map();
    
    for (const referral of referrals) {
      if (!referral.patient) continue;
      
      const patientId = referral.patient.id;
      
      if (!patientsMap.has(patientId)) {
        patientsMap.set(patientId, {
          ...referral.patient,
          referralCount: 0,
          referredOut: 0,
          referredIn: 0,
          lastReferralDate: referral.createdAt,
          referrals: []
        });
      }
      
      const patientData = patientsMap.get(patientId);
      patientData.referralCount++;
      
      // Track if referred out or in
      if (referral.referringFacilityId === facilityId) {
        patientData.referredOut++;
      }
      if (referral.receivingFacilityId === facilityId) {
        patientData.referredIn++;
      }
      
      // Update last referral date if this is more recent
      if (new Date(referral.createdAt) > new Date(patientData.lastReferralDate)) {
        patientData.lastReferralDate = referral.createdAt;
      }
      
      // Add referral summary
      patientData.referrals.push({
        id: referral.id,
        referralNumber: referral.referralNumber,
        date: referral.createdAt,
        status: referral.status,
        type: referral.referringFacilityId === facilityId ? 'outgoing' : 'incoming',
        fromFacility: referral.referringFacility?.name,
        toFacility: referral.receivingFacility?.name,
        urgencyLevel: referral.urgencyLevel
      });
    }

    const patients = Array.from(patientsMap.values());
    
    res.json(patients);
  } catch (error: any) {
    console.error('Get my patients error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get healthcare providers at a specific facility
export const getProvidersByFacility = async (req: Request, res: Response) => {
  try {
    const { facilityId } = req.params;
    const authReq = req as AuthRequest;
    const role = authReq.user?.role;

    if (role !== 'healthcare_provider' && role !== 'facility_admin' && role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (!facilityId) {
      return res.status(400).json({ message: 'Facility ID is required' });
    }

    // Get all healthcare providers at this facility
    const providers = await prisma.user.findMany({
      where: {
        facilityId: facilityId,
        role: 'healthcare_provider'
      },
      select: {
        id: true,
        name: true,
        email: true,
        specialization: true,
        licenseNumber: true,
        phone: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    res.json(providers);
  } catch (error: any) {
    console.error('Get providers by facility error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

