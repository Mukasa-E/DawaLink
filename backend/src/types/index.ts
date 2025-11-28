export type UserRole = 'patient' | 'healthcare_provider' | 'facility_admin' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  facilityId?: string;
  specialization?: string;
  licenseNumber?: string;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
}

export interface Facility {
  id: string;
  name: string;
  type: 'clinic' | 'pharmacy' | 'hospital' | 'health_center' | 'diagnostic_center';
  ownerId: string;
  registrationNumber: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  county?: string;
  operatingHours?: any;
  services: string[];
  isVerified: boolean;
  latitude?: number;
  longitude?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Referral {
  id: string;
  referralNumber: string;
  qrCode?: string;
  patientId: string;
  patientName: string;
  patientAge?: number;
  patientGender?: string;
  providerId: string;
  providerName: string;
  providerSpecialization?: string;
  referringFacilityId: string;
  receivingFacilityId?: string;
  reason: string;
  clinicalSummary: string;
  diagnosis?: string;
  vitalSigns?: any;
  testResults?: any;
  treatmentGiven?: string;
  recommendations?: string;
  urgencyLevel: 'emergency' | 'urgent' | 'routine';
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled' | 'expired';
  receivedBy?: string;
  receivedAt?: string;
  completionNotes?: string;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
}

export interface MedicalRecord {
  id: string;
  recordNumber: string;
  patientId: string;
  providerId: string;
  providerName: string;
  facilityId: string;
  facilityName: string;
  recordType: 'consultation' | 'test_result' | 'prescription' | 'diagnosis' | 'immunization' | 'surgery' | 'follow_up' | 'other';
  title: string;
  description: string;
  diagnosis?: string;
  treatment?: string;
  medications?: any;
  vitalSigns?: any;
  labResults?: any;
  attachments?: any;
  visitDate: string;
  isConfidential: boolean;
  shareableViaQR: boolean;
  qrCode?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PatientAuthorization {
  id: string;
  patientId: string;
  providerId?: string;
  facilityId?: string;
  accessLevel: 'view_only' | 'full_access';
  purpose?: string;
  grantedAt: string;
  expiresAt?: string;
  revokedAt?: string;
  isActive: boolean;
}

export interface PrescriptionMedicineEntry {
  facilityMedicineId: string;
  name: string;
  dosage?: string;        // e.g. "500mg"
  frequency?: string;     // e.g. "twice daily"
  duration?: string;      // e.g. "5 days"
}

export interface Prescription {
  id: string;
  prescriptionNumber: string;
  patientId: string;
  providerId: string;
  facilityId: string;
  facilityName: string;
  diagnosis?: string;
  notes?: string;
  medicines?: PrescriptionMedicineEntry[];
  status: 'draft' | 'issued' | 'fulfilled' | 'cancelled' | 'revoked';
  attachmentUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItemEntry {
  facilityMedicineId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  patientId: string;
  facilityId: string;
  facilityName: string;
  prescriptionId?: string;
  items: OrderItemEntry[];
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready_for_pickup' | 'out_for_delivery' | 'delivered' | 'cancelled';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

import { Request } from 'express';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    id: string;
    email: string;
    role: UserRole;
    facilityId?: string;
  };
}

