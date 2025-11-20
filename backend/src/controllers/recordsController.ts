import { Request, Response } from 'express';
import prisma from '../database/db';
import { v4 as uuidv4 } from 'uuid';
import type { MedicalRecord, AuthRequest } from '../types';

export const getAllRecords = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    const role = authReq.user?.role;
    const { patientId } = req.query;

    let records: any[] = [];

    if (role === 'patient') {
      records = await prisma.medicalRecord.findMany({
        where: { patientId: userId },
        orderBy: { date: 'desc' },
      });
    } else if (role === 'healthcare_provider' || role === 'admin') {
      if (patientId && typeof patientId === 'string') {
        records = await prisma.medicalRecord.findMany({
          where: { patientId },
          orderBy: { date: 'desc' },
        });
      } else {
        // Simplified: provider sees own records or authorized
        const authorizedPatientIds = await prisma.patientAuthorization.findMany({
          where: { providerId: userId },
          select: { patientId: true },
        });
        const patientIdList = authorizedPatientIds.map(a => a.patientId);
        records = await prisma.medicalRecord.findMany({
          where: {
            OR: [
              { providerId: userId },
              { isAuthorized: true },
              { patientId: { in: patientIdList } },
            ],
          },
          orderBy: { date: 'desc' },
        });
      }
    } else {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Parse attachments JSON
    records = records.map(record => ({
      ...record,
      attachments: (record as any).attachments ?? [],
      isAuthorized: Boolean(record.isAuthorized),
    }));

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

    const record = await prisma.medicalRecord.findUnique({ where: { id } });

    if (!record) {
      return res.status(404).json({ message: 'Record not found' });
    }

    // Check access
    if (role === 'patient' && record.patientId !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (role === 'healthcare_provider' && record.patientId !== userId) {
      // Check if provider has authorization
      const auth = await prisma.patientAuthorization.findUnique({
        where: { patientId_providerId: { patientId: record.patientId, providerId: userId! } },
      });
      if (!auth && !record.isAuthorized) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    // Parse attachments
    const recordWithAttachments = {
      ...record,
      attachments: (record as any).attachments ?? [],
      isAuthorized: Boolean(record.isAuthorized),
    };

    res.json(recordWithAttachments);
  } catch (error: any) {
    console.error('Get record error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createRecord = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const providerId = authReq.user?.id;

    if (!providerId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const { patientId, recordType, title, description, date, attachments } = req.body;

    if (!patientId || !recordType || !title || !description) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Get provider info
    const provider = await prisma.user.findUnique({ where: { id: providerId }, select: { name: true, facility: true } });
    const facilityName = provider?.facility || 'Unknown Facility';

    // Create record
    const id = uuidv4();
    const recordDate = date || new Date().toISOString();

    const record = await prisma.medicalRecord.create({
      data: {
        id,
        patientId,
        providerId,
        providerName: provider?.name || 'Unknown Provider',
        facilityName,
        recordType,
        title,
        description,
        date: new Date(recordDate),
        attachments: attachments ?? null,
        isAuthorized: true,
      },
    });
    
    const recordWithAttachments = {
      ...record,
      attachments: (record as any).attachments ?? [],
      isAuthorized: Boolean(record.isAuthorized),
    };

    res.status(201).json(recordWithAttachments);
  } catch (error: any) {
    console.error('Create record error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateRecord = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, attachments } = req.body;

    const record = await prisma.medicalRecord.findUnique({ where: { id } });
    if (!record) {
      return res.status(404).json({ message: 'Record not found' });
    }

    // Update record
    const updated = await prisma.medicalRecord.update({
      where: { id },
      data: {
        ...(title ? { title } : {}),
        ...(description ? { description } : {}),
        ...(attachments ? { attachments } : {}),
      },
    });
    
    const recordWithAttachments = {
      ...updated,
      attachments: (updated as any).attachments ?? [],
      isAuthorized: Boolean(updated.isAuthorized),
    };

    res.json(recordWithAttachments);
  } catch (error: any) {
    console.error('Update record error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

