export type UserRole = 'patient' | 'healthcare_provider' | 'admin' | 'customer' | 'pharmacy' | 'delivery_agent';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  facility?: string;
  passwordHash: string;
  createdAt: string;
}

export interface Referral {
  id: string;
  patientId: string;
  patientName: string;
  providerId: string;
  providerName: string;
  facilityName: string;
  reason: string;
  diagnosis?: string;
  recommendations?: string;
  referringFacility: string;
  referredToFacility: string;
  status: 'pending' | 'accepted' | 'completed' | 'cancelled';
  createdAt: string;
  notes?: string;
}

export interface MedicalRecord {
  id: string;
  patientId: string;
  providerId: string;
  providerName: string;
  facilityName: string;
  recordType: 'consultation' | 'test_result' | 'prescription' | 'diagnosis' | 'other';
  title: string;
  description: string;
  date: string;
  attachments?: string[];
  isAuthorized: boolean;
}

import { Request } from 'express';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
  };
}

