import axios from 'axios';
import type { 
  User, 
  Referral, 
  MedicalRecord, 
  RegisterData,
  Medicine,
  FacilityMedicine,
  Pharmacy,
  Order,
  Payment,
  DeliveryAssignment,
  Notification,
  MedicineSearchResponse,
  OrdersResponse,
  NotificationsResponse,
  PaymentMethod,
  OrderStatus,
  DeliveryStatus,
} from '../types';

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  login: async (email: string, password: string): Promise<{ user: User; token: string }> => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  
  register: async (data: RegisterData): Promise<{ user: User; token: string }> => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },
  
  getCurrentUser: async (): Promise<User> => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

// Referrals API
export const referralsAPI = {
  getAll: async (): Promise<Referral[]> => {
    const response = await api.get('/referrals');
    return response.data;
  },
  
  getById: async (id: string): Promise<Referral> => {
    const response = await api.get(`/referrals/${id}`);
    return response.data;
  },
  
  create: async (data: Partial<Referral>): Promise<Referral> => {
    const response = await api.post('/referrals', data);
    return response.data;
  },
  
  update: async (id: string, data: Partial<Referral>): Promise<Referral> => {
    const response = await api.put(`/referrals/${id}`, data);
    return response.data;
  },
  
  getQRCode: async (id: string): Promise<string> => {
    const response = await api.get(`/referrals/${id}/qr`);
    return response.data.qrCode;
  },
};

// Medical Records API
export const recordsAPI = {
  getAll: async (patientId?: string): Promise<MedicalRecord[]> => {
    const url = patientId ? `/records?patientId=${patientId}` : '/records';
    const response = await api.get(url);
    return response.data;
  },
  
  getById: async (id: string): Promise<MedicalRecord> => {
    const response = await api.get(`/records/${id}`);
    return response.data;
  },
  
  create: async (data: Partial<MedicalRecord>): Promise<MedicalRecord> => {
    const response = await api.post('/records', data);
    return response.data;
  },
  
  update: async (id: string, data: Partial<MedicalRecord>): Promise<MedicalRecord> => {
    const response = await api.put(`/records/${id}`, data);
    return response.data;
  },
};

// Patients API
export const patientsAPI = {
  search: async (query: string): Promise<User[]> => {
    const response = await api.get(`/patients/search?q=${encodeURIComponent(query)}`);
    return response.data;
  },
  
  getById: async (id: string): Promise<User> => {
    const response = await api.get(`/patients/${id}`);
    return response.data;
  },
  
  authorizeAccess: async (patientId: string, providerId: string): Promise<void> => {
    await api.post(`/patients/${patientId}/authorize`, { providerId });
  },
  
  revokeAccess: async (patientId: string, providerId: string): Promise<void> => {
    await api.delete(`/patients/${patientId}/authorize`, { data: { providerId } });
  },
};

// Admin API
export const adminAPI = {
  getStats: async (): Promise<{
    totalUsers: number;
    totalReferrals: number;
    totalRecords: number;
    activeFacilities: number;
  }> => {
    const response = await api.get('/admin/stats');
    return response.data;
  },
  
  getAllUsers: async (): Promise<User[]> => {
    const response = await api.get('/admin/users');
    return response.data;
  },
};

// Medicines API
export const medicinesAPI = {
  search: async (params?: {
    q?: string;
    category?: string;
    pharmacyId?: string;
    inStock?: boolean;
    limit?: number;
    skip?: number;
  }): Promise<MedicineSearchResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.q) queryParams.append('q', params.q);
    if (params?.category) queryParams.append('category', params.category);
    if (params?.pharmacyId) queryParams.append('pharmacyId', params.pharmacyId);
    if (params?.inStock !== undefined) queryParams.append('inStock', String(params.inStock));
    if (params?.limit) queryParams.append('limit', String(params.limit));
    if (params?.skip) queryParams.append('skip', String(params.skip));
    
    const response = await api.get(`/medicines/search?${queryParams.toString()}`);
    return response.data;
  },
  
  getById: async (id: string): Promise<Medicine> => {
    const response = await api.get(`/medicines/${id}`);
    return response.data;
  },
  
  getPharmacyMedicines: async (pharmacyId: string): Promise<Medicine[]> => {
    const response = await api.get(`/medicines/pharmacy/${pharmacyId}`);
    return response.data;
  },
  
  create: async (pharmacyId: string, data: Partial<Medicine>): Promise<Medicine> => {
    const response = await api.post(`/medicines/pharmacy/${pharmacyId}`, data);
    return response.data;
  },
  
  update: async (id: string, data: Partial<Medicine>): Promise<Medicine> => {
    const response = await api.put(`/medicines/${id}`, data);
    return response.data;
  },
  
  delete: async (id: string): Promise<void> => {
    await api.delete(`/medicines/${id}`);
  },
};

// Orders API
export const ordersAPI = {
  create: async (data: {
    pharmacyId: string;
    deliveryAddress: string;
    items: Array<{ medicineId: string; quantity: number }>;
    prescriptionId?: string;
  }): Promise<Order> => {
    const response = await api.post('/orders', data);
    return response.data;
  },
  
  getMyOrders: async (params?: { limit?: number; skip?: number }): Promise<OrdersResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', String(params.limit));
    if (params?.skip) queryParams.append('skip', String(params.skip));
    
    const response = await api.get(`/orders/my-orders?${queryParams.toString()}`);
    return response.data;
  },
  
  getById: async (id: string): Promise<Order> => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },
  
  cancel: async (id: string): Promise<Order> => {
    const response = await api.post(`/orders/${id}/cancel`);
    return response.data;
  },
  
  getPharmacyOrders: async (pharmacyId: string, status?: OrderStatus): Promise<Order[]> => {
    const url = status 
      ? `/orders/pharmacy/${pharmacyId}?status=${status}`
      : `/orders/pharmacy/${pharmacyId}`;
    const response = await api.get(url);
    return response.data;
  },
  
  updateStatus: async (id: string, status: OrderStatus): Promise<Order> => {
    const response = await api.patch(`/orders/${id}/status`, { status });
    return response.data;
  },
};

// Pharmacy API
export const pharmacyAPI = {
  getAll: async (params?: { city?: string; isVerified?: boolean }): Promise<Pharmacy[]> => {
    const queryParams = new URLSearchParams();
    if (params?.city) queryParams.append('city', params.city);
    if (params?.isVerified !== undefined) queryParams.append('isVerified', String(params.isVerified));
    
    const response = await api.get(`/pharmacy/all?${queryParams.toString()}`);
    return response.data;
  },
  
  getById: async (id: string): Promise<Pharmacy> => {
    const response = await api.get(`/pharmacy/${id}`);
    return response.data;
  },
  
  register: async (data: Partial<Pharmacy>): Promise<Pharmacy> => {
    const response = await api.post('/pharmacy/register', data);
    return response.data;
  },
  
  getMyPharmacy: async (): Promise<Pharmacy> => {
    const response = await api.get('/pharmacy/my/pharmacy');
    return response.data;
  },
  
  update: async (id: string, data: Partial<Pharmacy>): Promise<Pharmacy> => {
    const response = await api.put(`/pharmacy/${id}`, data);
    return response.data;
  },
  
  verify: async (id: string, isVerified: boolean): Promise<Pharmacy> => {
    const response = await api.patch(`/pharmacy/${id}/verify`, { isVerified });
    return response.data;
  },
};

// Delivery API
export const deliveryAPI = {
  getMyDeliveries: async (status?: DeliveryStatus): Promise<DeliveryAssignment[]> => {
    const url = status ? `/delivery/my-deliveries?status=${status}` : '/delivery/my-deliveries';
    const response = await api.get(url);
    return response.data;
  },
  
  getAvailable: async (): Promise<DeliveryAssignment[]> => {
    const response = await api.get('/delivery/available');
    return response.data;
  },
  
  accept: async (id: string): Promise<DeliveryAssignment> => {
    const response = await api.post(`/delivery/${id}/accept`);
    return response.data;
  },
  
  updateStatus: async (id: string, data: {
    status: DeliveryStatus;
    latitude?: number;
    longitude?: number;
    notes?: string;
  }): Promise<DeliveryAssignment> => {
    const response = await api.patch(`/delivery/${id}/status`, data);
    return response.data;
  },
  
  createAssignment: async (orderId: string): Promise<DeliveryAssignment> => {
    const response = await api.post('/delivery/assign', { orderId });
    return response.data;
  },
  
  getByOrderId: async (orderId: string): Promise<DeliveryAssignment> => {
    const response = await api.get(`/delivery/order/${orderId}`);
    return response.data;
  },
};

// Payments API
export const paymentsAPI = {
  process: async (data: {
    orderId: string;
    amount: number;
    method: PaymentMethod;
    phoneNumber?: string;
  }): Promise<Payment> => {
    const response = await api.post('/payments/process', data);
    return response.data;
  },
  
  verifyMobile: async (data: {
    transactionRef: string;
    orderId: string;
  }): Promise<Payment> => {
    const response = await api.post('/payments/verify-mobile', data);
    return response.data;
  },
  
  verifyCard: async (data: {
    paymentIntentId: string;
    orderId: string;
  }): Promise<Payment> => {
    const response = await api.post('/payments/verify-card', data);
    return response.data;
  },
  
  getHistory: async (params?: { limit?: number; skip?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', String(params.limit));
    if (params?.skip) queryParams.append('skip', String(params.skip));
    
    const response = await api.get(`/payments/history?${queryParams.toString()}`);
    return response.data;
  },
  
  getByOrderId: async (orderId: string): Promise<Payment> => {
    const response = await api.get(`/payments/order/${orderId}`);
    return response.data;
  },
  
  refund: async (id: string, reason: string): Promise<Payment> => {
    const response = await api.post(`/payments/${id}/refund`, { reason });
    return response.data;
  },
};

// Notifications API
export const notificationsAPI = {
  getMyNotifications: async (params?: {
    limit?: number;
    skip?: number;
    unreadOnly?: boolean;
  }): Promise<NotificationsResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', String(params.limit));
    if (params?.skip) queryParams.append('skip', String(params.skip));
    if (params?.unreadOnly !== undefined) queryParams.append('unreadOnly', String(params.unreadOnly));
    
    const response = await api.get(`/notifications/my-notifications?${queryParams.toString()}`);
    return response.data;
  },
  
  markAsRead: async (id: string): Promise<Notification> => {
    const response = await api.patch(`/notifications/${id}/read`);
    return response.data;
  },
  
  markAllAsRead: async (): Promise<{ message: string; count: number }> => {
    const response = await api.post('/notifications/mark-all-read');
    return response.data;
  },
  
  delete: async (id: string): Promise<void> => {
    await api.delete(`/notifications/${id}`);
  },
};

// Facility Medicines API
export const facilityMedicinesAPI = {
  uploadCSV: async (csvData: string, facilityName: string): Promise<{ message: string; count: number }> => {
    const response = await api.post('/facility-medicines/upload', { csvData, facilityName });
    return response.data;
  },
  
  addMedicine: async (medicine: Partial<FacilityMedicine>): Promise<FacilityMedicine> => {
    const response = await api.post('/facility-medicines', medicine);
    return response.data;
  },
  
  getFacilityMedicines: async (facilityName: string, params?: {
    search?: string;
    category?: string;
  }): Promise<FacilityMedicine[]> => {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.category) queryParams.append('category', params.category);
    
    const url = `/facility-medicines/${encodeURIComponent(facilityName)}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await api.get(url);
    return response.data;
  },
  
  getAllFacilities: async (): Promise<string[]> => {
    const response = await api.get('/facility-medicines/facilities');
    return response.data;
  },
  
  getLowStockMedicines: async (facilityName: string): Promise<FacilityMedicine[]> => {
    const response = await api.get(`/facility-medicines/${encodeURIComponent(facilityName)}/low-stock`);
    return response.data;
  },
  
  updateStock: async (id: string, stock: number): Promise<FacilityMedicine> => {
    const response = await api.patch(`/facility-medicines/${id}/stock`, { stock });
    return response.data;
  },
  
  deleteMedicine: async (id: string): Promise<void> => {
    await api.delete(`/facility-medicines/${id}`);
  },
};

export default api;

