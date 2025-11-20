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
      select: { facility: true },
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
    if (role === 'healthcare_provider' && currentUser?.facility) {
      whereClause.preferredFacility = currentUser.facility;
    }

    const searchTerm = `%${q}%`;
    const patients = await prisma.user.findMany({
      where: whereClause,
      select: { 
        id: true, 
        email: true, 
        name: true, 
        role: true, 
        phone: true, 
        facility: true,
        preferredFacility: true,
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
        facility: true, 
        preferredFacility: true,
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
    const existing = await prisma.patientAuthorization.findUnique({
      where: { patientId_providerId: { patientId, providerId } },
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

    await prisma.patientAuthorization.delete({
      where: { patientId_providerId: { patientId, providerId } },
    });

    res.json({ message: 'Access revoked successfully' });
  } catch (error: any) {
    console.error('Revoke access error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

